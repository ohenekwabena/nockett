import { createClient } from "@/api/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/types/database.types";
import type { ShiftValue } from "@/lib/schedule-service";

/**
 * The schedule-history read/write seam.
 *
 * Contract (ADR-0002): methods return unwrapped domain values and throw on a
 * data-access error — callers never see Supabase's { data, error } envelope.
 *
 * A saved schedule is the deterministic tuple the rota page generates from
 * (year, month, seed) plus the admin's manual `overrides` (see
 * schedule-service). Reloading a record replays generateMonthSchedule with the
 * stored seed and re-applies the overrides, reproducing the exact grid without
 * persisting the expanded schedule. Reads are open to any authenticated user;
 * writes are RLS-gated to Admins (migration 020), so a non-admin insert/delete
 * simply fails at the database rather than being enforced here.
 */

/** One saved schedule row (migration 020). */
export type SavedSchedule = Tables<"schedules">;

/** The fields a caller supplies when saving the current rota to history. */
export interface SaveScheduleInput {
  year: number;
  month: number;
  seed: number;
  overrides: Record<string, ShiftValue>;
  /** Optional admin-supplied name; the UI defaults it to the month label. */
  label?: string | null;
  /** Acting user's id, stored as created_by (nullable). */
  createdBy?: string | null;
}

// Lazily created so importing this module (e.g. a unit test that injects its
// own client) never needs the browser env.
let browserClient: SupabaseClient | null = null;
function defaultClient(): SupabaseClient {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

/**
 * Persist the current rota as a new immutable history snapshot. Returns the
 * saved row (with its generated id and created_at). Throws on a data-access
 * error; a non-admin caller is rejected by RLS.
 */
export async function saveSchedule(
  input: SaveScheduleInput,
  client: SupabaseClient = defaultClient(),
): Promise<SavedSchedule> {
  const { data, error } = await client
    .from("schedules")
    .insert({
      year: input.year,
      month: input.month,
      seed: input.seed,
      overrides: input.overrides,
      label: input.label?.trim() || null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(`schedule-history-service.saveSchedule failed: ${error.message}`);
  return data as SavedSchedule;
}

/**
 * Every saved schedule, newest-first — matches the (created_at desc) index from
 * migration 020. History is naturally small (a handful of rotas a month), so
 * this returns the whole list in one read with no paging. Throws on a
 * data-access error.
 */
export async function listSchedules(client: SupabaseClient = defaultClient()): Promise<SavedSchedule[]> {
  const { data, error } = await client
    .from("schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`schedule-history-service.listSchedules failed: ${error.message}`);
  return (data ?? []) as SavedSchedule[];
}

/**
 * Remove a saved schedule. Throws on a data-access error; RLS restricts this to
 * Admins, so a non-admin delete is a no-op at the row level.
 */
export async function deleteSchedule(id: string, client: SupabaseClient = defaultClient()): Promise<void> {
  const { error } = await client.from("schedules").delete().eq("id", id);
  if (error) throw new Error(`schedule-history-service.deleteSchedule failed: ${error.message}`);
}
