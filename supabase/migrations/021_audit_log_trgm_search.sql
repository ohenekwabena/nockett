-- 021_audit_log_trgm_search.sql
--
-- AUDIT-5 (revised): switch Audit Log payload search from whole-word full-text
-- to SUBSTRING search.
--
-- ---------------------------------------------------------------------------
-- Why the change.
-- ---------------------------------------------------------------------------
-- 019 indexed the payload as a tsvector and matched it with
-- websearch_to_tsquery('simple', …). That is WHOLE-WORD (whole-lexeme) search:
-- it can only match complete tokens. In practice Admins search *fragments* --
-- part of an email ("jane" in "jane.doe@acme.com"), a bare ticket number ("123"
-- in "NOC-123"), a partial name -- and full-text returns nothing for all of
-- them, because the tokenizer folds emails/identifiers into single lexemes and
-- attaches punctuation to numbers. The search box therefore read as "broken".
--
-- Substring search (ILIKE '%term%') is what a fragment-search box actually wants,
-- and pg_trgm's GIN index keeps it index-driven rather than a sequential scan.
--
--   whole-word FTS (019)          →  substring ILIKE (this migration)
--   "jane"  finds nothing         →  "jane"  finds jane.doe@acme.com
--   "123"   finds nothing         →  "123"   finds NOC-123
--   "resolved" finds it           →  "resolved" still finds it (substring too)
--
-- ---------------------------------------------------------------------------
-- Mechanism.
-- ---------------------------------------------------------------------------
--   * pg_trgm: provides the gin_trgm_ops operator class that makes ILIKE / LIKE
--     '%…%' index-accelerated (trigram matching). Installed into the `extensions`
--     schema, which is on the search_path, so gin_trgm_ops resolves unqualified.
--   * changes_text: a STORED generated column holding changes::text -- the exact
--     same canonical JSON text 019 fed to to_tsvector, so keys ("status"), string
--     values ("Resolved"), emails and numbers are all searchable as substrings.
--     PostgREST needs a *named* column to filter on (it cannot ILIKE an expression
--     like changes::text), and the trigram index needs a column to index; the
--     generated column serves both and Postgres keeps it in sync on every write.
--     Like changes_fts before it, it is an internal search artifact: NOT part of
--     the AuditEvent domain type, and the read seam never selects it.
--   * The read seam (src/lib/audit-service.ts) issues
--     changes_text ILIKE '%<term>%' via PostgREST .ilike("changes_text", …),
--     splitting the box on whitespace so each fragment ANDs (order-independent).
--
-- Trigram note: the GIN index accelerates patterns with >= 3 non-wildcard chars.
-- A 1-2 char search still returns correct results, just via a sequential scan --
-- fine for an audit log of this size.
--
-- ---------------------------------------------------------------------------
-- Drop the 019 full-text artifacts -- nothing reads them once the seam switches.
-- (changes_fts is a generated column, trivially re-creatable from 019 if needed.)
-- ---------------------------------------------------------------------------
drop index if exists public.audit_log_changes_fts_idx;
alter table public.audit_log drop column if exists changes_fts;

create extension if not exists pg_trgm;

alter table public.audit_log
  add column if not exists changes_text text
  generated always as (changes::text) stored;

create index if not exists audit_log_changes_text_trgm_idx
  on public.audit_log using gin (changes_text gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Verify the index is used (acceptance criterion). On a populated table the plan
-- must show a Bitmap Index Scan on audit_log_changes_text_trgm_idx for a >= 3-char
-- fragment, never a Seq Scan (the planner only falls back to a seq scan when the
-- table is tiny):
--
--   explain analyze
--   select id, txid, entity_type, entity_id, action, actor_id, actor_email,
--          actor_name, changes, created_at
--     from public.audit_log
--    where changes_text ilike '%jane%';
-- ---------------------------------------------------------------------------
