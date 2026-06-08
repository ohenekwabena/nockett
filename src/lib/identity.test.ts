import { describe, it, expect, vi, beforeEach } from "vitest";

// A hoisted, chainable Supabase mock so identity.ts's module-level
// createClient() receives it. The chainable methods return the builder;
// the terminal calls (single/maybeSingle) are configured per test.
const { from, single, maybeSingle, insert } = vi.hoisted(() => {
  const single = vi.fn();
  const maybeSingle = vi.fn();
  const insert = vi.fn();
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.insert = vi.fn(() => {
    insert();
    return builder;
  });
  builder.single = single;
  builder.maybeSingle = maybeSingle;
  return { from: vi.fn(() => builder), single, maybeSingle, insert };
});

vi.mock("@/api/supabase/client", () => ({
  createClient: () => ({ from }),
}));

import { getProfile, ensureProfile, isAdmin, type Profile } from "./identity";

const profile: Profile = {
  id: "u1",
  email: "ada@example.com",
  name: "Ada",
  role: "admin",
  department_id: null,
  imageurl: null,
  created_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isAdmin", () => {
  it("is true only for the admin Role, case-insensitively", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("user")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("getProfile", () => {
  it("returns the unwrapped profile (no { data, error } envelope)", async () => {
    single.mockResolvedValueOnce({ data: profile, error: null });
    await expect(getProfile("u1")).resolves.toEqual(profile);
    expect(from).toHaveBeenCalledWith("users");
  });

  it("throws when the read errors", async () => {
    single.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(getProfile("u1")).rejects.toThrow(/boom/);
  });
});

describe("ensureProfile", () => {
  it("returns the existing profile without inserting", async () => {
    maybeSingle.mockResolvedValueOnce({ data: profile, error: null });
    await expect(ensureProfile({ id: "u1", email: "ada@example.com", name: "Ada" })).resolves.toEqual(profile);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts and returns a new profile when none exists", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    single.mockResolvedValueOnce({ data: profile, error: null });
    await expect(
      ensureProfile({ id: "u1", email: "ada@example.com", name: "Ada", role: "admin" }),
    ).resolves.toEqual(profile);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("throws when the lookup errors and does not insert", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "lookup-fail" } });
    await expect(ensureProfile({ id: "u1", email: "ada@example.com", name: "Ada" })).rejects.toThrow(/lookup-fail/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("throws when the insert errors", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    single.mockResolvedValueOnce({ data: null, error: { message: "insert-fail" } });
    await expect(ensureProfile({ id: "u1", email: "ada@example.com", name: "Ada" })).rejects.toThrow(/insert-fail/);
  });
});
