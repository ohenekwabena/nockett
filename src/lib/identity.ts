import { createClient } from "@/api/supabase/client";
import type { Tables } from "@/types/database.types";

/**
 * The identity seam: the single source of truth for a User's profile
 * (public.users) and their Role.
 *
 * Contract (ADR-0002): methods return unwrapped domain values and throw on a
 * data-access error — callers never see Supabase's { data, error } envelope.
 * Authorization (ADR-0001): a Role is the users.role enum, never the dead
 * roles/user_roles junction.
 */

/** A User's access level — the authoritative users.role enum (ADR-0001). */
export type Role = "user" | "admin";

/**
 * A User's profile row plus their Role.
 *
 * NOTE: the generated database types are currently stale — public.users.role
 * is missing from Tables<"users"> — so the Role is intersected in here. Once
 * database.types.ts is regenerated this intersection becomes a no-op.
 */
export type Profile = Tables<"users"> & { role: Role };

export interface EnsureProfileInput {
  id: string;
  email: string;
  name: string;
  /** Supplied by the caller (e.g. from an invite); defaults to "user". */
  role?: Role;
}

const supabase = createClient();

/** True when the given Role is the elevated admin Role. */
export function isAdmin(role: Role | string | null | undefined): boolean {
  return typeof role === "string" && role.toLowerCase() === "admin";
}

/** Read a User's profile by id. Throws if the read fails or the row is missing. */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) throw new Error(`identity.getProfile(${userId}) failed: ${error.message}`);
  return data as Profile;
}

/**
 * Idempotently ensure a User's profile row exists, returning it. The Role is
 * supplied by the caller (default "user") — identity stays ignorant of invites.
 * Throws on a read/write failure.
 */
export async function ensureProfile({ id, email, name, role = "user" }: EnsureProfileInput): Promise<Profile> {
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw new Error(`identity.ensureProfile(${id}) lookup failed: ${lookupError.message}`);
  if (existing) return existing as Profile;

  const { data, error } = await supabase
    .from("users")
    .insert({ id, email, name, role })
    .select("*")
    .single();
  if (error) throw new Error(`identity.ensureProfile(${id}) insert failed: ${error.message}`);
  return data as Profile;
}
