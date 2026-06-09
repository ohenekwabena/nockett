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

/** One row of the Audit Log. */
export type AuditEvent = Tables<"audit_log">;

/**
 * Keyset cursor: the (created_at, id) of the last row already seen. The next
 * page is the rows strictly older than this, matching the
 * (created_at desc, id desc) index from migration 017.
 */
export interface AuditCursor {
  created_at: string;
  id: number;
}

export interface ListEventsParams {
  /** Page size. Defaults to {@link DEFAULT_AUDIT_PAGE_SIZE}. */
  limit?: number;
  /** Walk strictly older than this cursor; omit/null for the first (newest) page. */
  cursor?: AuditCursor | null;
}

export interface ListEventsResult {
  events: AuditEvent[];
  /** Feed back into the next listEvents call; null once the log is exhausted. */
  nextCursor: AuditCursor | null;
}

export const DEFAULT_AUDIT_PAGE_SIZE = 50;

// Lazily created so importing this module (e.g. a unit test that injects its own
// client) never needs the browser env. The server component passes its own
// cookie-bound client instead, so RLS sees the acting Admin.
let browserClient: SupabaseClient | null = null;
function defaultClient(): SupabaseClient {
  if (!browserClient) browserClient = createClient();
  return browserClient;
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
  { limit = DEFAULT_AUDIT_PAGE_SIZE, cursor = null }: ListEventsParams = {},
  client: SupabaseClient = defaultClient(),
): Promise<ListEventsResult> {
  let query = client
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

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
