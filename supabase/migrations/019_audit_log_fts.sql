-- 019_audit_log_fts.sql
--
-- AUDIT-5: full-text search over Audit Event change payloads.
--
-- Goal: let an Admin search *within* audit_log.changes -- e.g. "every event where
-- status was set to CLOSED" -- not just filter by the structured dimensions
-- (AUDIT-3). This is free-text WORD search from a search box, so we index words,
-- not structure.
--
-- ---------------------------------------------------------------------------
-- Decision: word search via to_tsvector, NOT jsonb containment.
-- ---------------------------------------------------------------------------
-- Two approaches were on the table (docs/issues/audit-5-full-text-search.md):
--
--   (a) jsonb_path_ops GIN + the @> containment operator. Precise, but the caller
--       must spell the exact path and value, e.g.
--       changes @> '{"status":{"new":"CLOSED"}}'. A free-text search box cannot
--       express that, so containment is the wrong fit for this UI.
--   (b) a tsvector built from the payload + the @@ match operator with
--       websearch_to_tsquery. The Admin types "CLOSED" and gets every event whose
--       payload contains that word. This is what a search box wants. <-- CHOSEN.
--
-- Corpus:  to_tsvector('simple', changes::text)
--   * changes::text is the jsonb's canonical text form, so keys ("status"),
--     string values ("CLOSED") and numeric values alike become searchable words --
--     broader than to_tsvector('simple', changes), whose jsonb overload indexes
--     string *values* only.
--   * the 'simple' config (no stemming, no stop words) is deliberate: audit
--     payloads are identifiers, enum values, emails and UUIDs, not prose.
--     'english' would conflate "CLOSED"/"closing" by stemming and drop tokens
--     such as "new"/"old" as stop words.
--   * the two-arg to_tsvector(regconfig, text) is IMMUTABLE (the one-arg form is
--     only STABLE), which is what lets it back a STORED generated column.
--
-- Operator class / query operator (recorded so reads stay consistent):
--   * index:  GIN over tsvector  -- operator class tsvector_ops (the only GIN
--             class for tsvector).
--   * query:  changes_fts @@ websearch_to_tsquery('simple', <user text>)
--   The read seam (src/lib/audit-service.ts) issues exactly this via PostgREST
--   .textSearch('changes_fts', q, { type: 'websearch', config: 'simple' }).
--
-- Why a STORED generated column rather than a bare expression index:
--   supabase-js / PostgREST .textSearch(col, ...) emits `col @@ websearch_to_tsquery(...)`
--   and references col BY NAME. On a jsonb column `@@` is the SQL/JSON *path*
--   predicate, not full-text, so .textSearch() cannot point at `changes` directly.
--   Materialising the vector in a named tsvector column gives the API a column to
--   match AND a column to index, and Postgres keeps it in sync on every write. The
--   column is an internal search artifact: it is NOT part of the AuditEvent domain
--   type and the read seam never selects it.
--
-- changes itself is untouched, so the {col:{old,new}} diff shape from AUDIT-1 stays
-- stable and search behaves predictably.

alter table public.audit_log
  add column if not exists changes_fts tsvector
  generated always as (to_tsvector('simple', changes::text)) stored;

create index if not exists audit_log_changes_fts_idx
  on public.audit_log using gin (changes_fts);

-- ---------------------------------------------------------------------------
-- Verify the index is used (AUDIT-5 acceptance criterion). On a populated table
-- the plan must show a Bitmap Index Scan on audit_log_changes_fts_idx, never a Seq
-- Scan (the planner only falls back to a seq scan when the table is tiny):
--
--   explain analyze
--   select id, txid, entity_type, entity_id, action, actor_id, actor_email,
--          actor_name, changes, created_at
--     from public.audit_log
--    where changes_fts @@ websearch_to_tsquery('simple', 'CLOSED');
-- ---------------------------------------------------------------------------
