import { createClient } from "@/api/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database.types";

/**
 * The audit read seam.
 *
 * Contract (ADR-0002): methods return unwrapped domain values and throw on a
 * data-access error — callers never see Supabase's { data, error } envelope.
 *
 * Unlike every other seam this one is intentionally READ-ONLY (ADR-0004): Audit
 * Events are written only by the `audit_row()` database trigger, never by the
 * app. Reads are RLS-gated to Admins, so a non-admin caller simply gets an empty
 * result rather than an error.
 */

/**
 * One row of the Audit Log. Excludes `changes_text`, the internal text mirror of
 * `changes` that backs substring search (AUDIT-5, migration 021): it is a search
 * artifact, not domain data, so the read seam neither selects it nor exposes it
 * to callers. (`changes_fts` from migration 019 was dropped by 021.)
 */
export type AuditEvent = Omit<Tables<"audit_log">, "changes_fts" | "changes_text">;

/**
 * The Audit Event columns to read — every audit_log column EXCEPT `changes_text`
 * (the trigram-indexed search mirror from migration 021). Selecting these by name
 * keeps the mirror off the wire and out of {@link AuditEvent}.
 */
const AUDIT_COLUMNS =
  "id, txid, entity_type, entity_id, action, actor_id, actor_email, actor_name, changes, created_at";

/**
 * Keyset cursor: the (created_at, id) of the last row already seen. The next
 * page is the rows strictly older than this, matching the
 * (created_at desc, id desc) index from migration 017.
 */
export interface AuditCursor {
  created_at: string;
  id: number;
}

/**
 * Optional narrowing for {@link listEvents} (AUDIT-3). Every field is a single
 * AND-able predicate, so any combination composes cleanly with the keyset cursor
 * without disturbing the newest-first order or pagination. An omitted/empty field
 * is no constraint. Date bounds are absolute ISO instants (the UI widens a picked
 * calendar day to its full span before calling — see lib/audit-filters).
 */
export interface AuditFilters {
  /** created_at >= this ISO instant (inclusive lower bound). */
  createdFrom?: string | null;
  /** created_at <= this ISO instant (inclusive upper bound). */
  createdTo?: string | null;
  /** Exact acting User (audit_log.actor_id / auth uid). */
  actorId?: string | null;
  /** Exact audited table name (audit_log.entity_type). */
  entityType?: string | null;
  /** Exact action: one of {@link AUDIT_ACTIONS}. */
  action?: string | null;
  /**
   * Free-text SUBSTRING search over the change payload (AUDIT-5). Matched against
   * the trigram-indexed `changes_text` mirror with `ILIKE '%term%'` (migration
   * 021): "jane" finds every Audit Event whose payload contains that fragment
   * (e.g. "jane.doe@acme.com"), case-insensitively — partial emails, bare ticket
   * numbers, and partial names all hit, unlike the whole-word full-text it
   * replaced. Whitespace splits the box into fragments that each AND (so "jane
   * closed" needs both substrings, order-independent). ANDs with the other
   * predicates and the keyset cursor; trimmed, so an empty/blank value is no
   * constraint.
   */
  search?: string | null;
}

export interface ListEventsParams {
  /** Page size. Defaults to {@link DEFAULT_AUDIT_PAGE_SIZE}. */
  limit?: number;
  /** Walk strictly older than this cursor; omit/null for the first (newest) page. */
  cursor?: AuditCursor | null;
  /** Narrow the log; omit for the full log. */
  filters?: AuditFilters;
}

export interface ListEventsResult {
  events: AuditEvent[];
  /** Feed back into the next listEvents call; null once the log is exhausted. */
  nextCursor: AuditCursor | null;
}

export const DEFAULT_AUDIT_PAGE_SIZE = 50;

/**
 * The actions an Audit Event can record — the `audit_log.action` CHECK
 * constraint (migrations 017 + 022). Drives the action filter dropdown. `login`
 * is captured by the trigger on `auth.sessions` (migration 022, AUDIT-7).
 */
export const AUDIT_ACTIONS = ["insert", "update", "delete", "login"] as const;

/**
 * The audited entity types (table names) the entity filter can target, in a
 * human-sensible order. Mirrors the triggers wired in migrations 017 (`tickets`),
 * 018 (the rest), and 022 (`sessions`, i.e. sign-ins); if a new table is audited,
 * add it here so it becomes filterable. Unlisted types still appear in the log —
 * just not in this dropdown.
 */
export const AUDIT_ENTITY_TYPES = [
  "sessions",
  "tickets",
  "ticket_comments",
  "ticket_notes",
  "ticket_attachments",
  "users",
  "invites",
  "assignee",
  "ticket_categories",
  "ticket_priorities",
  "departments",
  "demarcations",
  "links",
  "sites",
  "service_types",
  "detection_sources",
  "traffic_impacts",
] as const;

// Lazily created so importing this module (e.g. a unit test that injects its own
// client) never needs the browser env. The server component passes its own
// cookie-bound client instead, so RLS sees the acting Admin.
let browserClient: SupabaseClient | null = null;
function defaultClient(): SupabaseClient {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

/**
 * Escape a user fragment so LIKE/ILIKE metacharacters match literally. `%` and
 * `_` are LIKE wildcards and `\` is the default escape char, so a fragment like
 * "50%" or "a_b" searches for that exact text rather than a pattern. The fragment
 * is then wrapped in %…% by the caller for a substring match.
 */
function escapeLikePattern(fragment: string): string {
  return fragment.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * List Audit Events newest-first with keyset pagination over (created_at, id).
 *
 * Fetches one row beyond `limit` to decide whether a further page exists, so the
 * returned `nextCursor` is null exactly when the log is exhausted — no empty
 * trailing page. Throws on a data-access error.
 *
 * @param client injected for the SSR first page (server client) and in tests;
 *   defaults to the shared browser client for client-side "load more".
 */
export async function listEvents(
  { limit = DEFAULT_AUDIT_PAGE_SIZE, cursor = null, filters }: ListEventsParams = {},
  client: SupabaseClient = defaultClient(),
): Promise<ListEventsResult> {
  let query = client
    .from("audit_log")
    .select(AUDIT_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  // Filters are plain equality/range predicates, so each ANDs with everything
  // else — including the keyset .or() below — leaving order and paging intact.
  // A falsy value (undefined/null/"") is simply no constraint.
  if (filters?.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters?.createdTo) query = query.lte("created_at", filters.createdTo);
  if (filters?.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters?.action) query = query.eq("action", filters.action);

  // Substring search over the change payload (AUDIT-5). Each whitespace-separated
  // fragment becomes a case-insensitive `changes_text ILIKE '%fragment%'` on the
  // trigram-indexed mirror (migration 021); repeated same-column filters AND in
  // PostgREST, so all fragments must be present (order-independent), and they ALSO
  // AND with the structured predicates and the keyset cursor. LIKE metacharacters
  // in the fragment are escaped so they match literally. Trim/split so a blank box
  // is no constraint.
  for (const fragment of filters?.search?.trim().split(/\s+/).filter(Boolean) ?? []) {
    query = query.ilike("changes_text", `%${escapeLikePattern(fragment)}%`);
  }

  if (cursor) {
    // Strict keyset predicate: created_at < c.created_at OR (=, id < c.id).
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`audit-service.listEvents failed: ${error.message}`);

  const rows = (data ?? []) as AuditEvent[];
  const hasMore = rows.length > limit;
  const events = hasMore ? rows.slice(0, limit) : rows;
  const last = events[events.length - 1];
  const nextCursor = hasMore && last ? { created_at: last.created_at, id: last.id } : null;

  return { events, nextCursor };
}

/** Identifies one audited row for {@link getEventsForEntity}. */
export interface EntityTrailParams {
  /** The audited table name (audit_log.entity_type), e.g. "tickets". */
  entityType: string;
  /** The row's id as stored in audit_log.entity_id — the entity uuid AS TEXT. */
  entityId: string;
}

/**
 * The complete chronological Audit trail for a single entity (AUDIT-4): every
 * Audit Event recorded against (entityType, entityId), oldest-first so it reads
 * as a timeline (insert → update… → delete).
 *
 * Served by the (entity_type, entity_id) index from migration 017 — both columns
 * are matched by equality, so it stays index-driven (no sequential scan) as the
 * log grows. A single entity's trail is naturally bounded (a handful to dozens of
 * events), so unlike {@link listEvents} this returns the whole trail in one read
 * with no keyset paging. Throws on a data-access error (ADR-0002); a non-admin
 * caller simply sees an empty trail (RLS).
 *
 * @param client injected in tests and for the browser-side drill-down; defaults
 *   to the shared browser client.
 */
export async function getEventsForEntity(
  { entityType, entityId }: EntityTrailParams,
  client: SupabaseClient = defaultClient(),
): Promise<AuditEvent[]> {
  const { data, error } = await client
    .from("audit_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(`audit-service.getEventsForEntity failed: ${error.message}`);
  return (data ?? []) as AuditEvent[];
}
