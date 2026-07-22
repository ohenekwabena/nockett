import { describe, it, expect, vi } from "vitest";

// The service lazily creates a browser client only when none is injected. Every
// test injects its own client, so this mock just keeps the import safe.
vi.mock("@/api/supabase/client", () => ({ createClient: () => ({ from: vi.fn() }) }));

import {
  deleteSchedule,
  listSchedules,
  saveSchedule,
  type SavedSchedule,
} from "./schedule-history-service";

/**
 * A chainable, awaitable PostgREST-builder stub. Chainable methods record their
 * args and return the builder; `.single()` and awaiting the builder both resolve
 * to the configured { data, error } (the builder is a thenable, like the real
 * query builder).
 */
function makeClient(response: { data: unknown; error: unknown }) {
  const calls = {
    from: [] as string[],
    insert: [] as unknown[],
    select: [] as string[],
    order: [] as Array<[string, unknown]>,
    eq: [] as Array<[string, unknown]>,
    delete: 0,
    single: 0,
  };
  const builder: Record<string, unknown> = {
    insert: vi.fn((payload: unknown) => {
      calls.insert.push(payload);
      return builder;
    }),
    select: vi.fn((columns: string) => {
      calls.select.push(columns);
      return builder;
    }),
    order: vi.fn((column: string, options: unknown) => {
      calls.order.push([column, options]);
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      calls.eq.push([column, value]);
      return builder;
    }),
    delete: vi.fn(() => {
      calls.delete += 1;
      return builder;
    }),
    single: vi.fn(() => {
      calls.single += 1;
      return builder;
    }),
    then: (resolve: (value: unknown) => void) => resolve(response),
  };
  const from = vi.fn((table: string) => {
    calls.from.push(table);
    return builder;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: { from } as any, calls };
}

function row(overrides: Partial<SavedSchedule> = {}): SavedSchedule {
  return {
    id: "sched-1",
    year: 2026,
    month: 7,
    seed: 20260707,
    overrides: {},
    label: "July 2026",
    created_by: "user-1",
    created_at: "2026-07-22T10:00:00Z",
    ...overrides,
  };
}

describe("saveSchedule", () => {
  it("inserts the mapped snapshot and returns the saved row", async () => {
    const saved = row();
    const { client, calls } = makeClient({ data: saved, error: null });

    const result = await saveSchedule(
      {
        year: 2026,
        month: 7,
        seed: 20260707,
        overrides: { "Jesse|2026-07-01": "N" },
        label: "  July 2026  ",
        createdBy: "user-1",
      },
      client,
    );

    expect(result).toEqual(saved);
    expect(calls.from).toEqual(["schedules"]);
    expect(calls.insert).toEqual([
      {
        year: 2026,
        month: 7,
        seed: 20260707,
        overrides: { "Jesse|2026-07-01": "N" },
        label: "July 2026", // trimmed
        created_by: "user-1",
      },
    ]);
    expect(calls.single).toBe(1);
  });

  it("stores a null label when none is supplied and defaults created_by to null", async () => {
    const { client, calls } = makeClient({ data: row({ label: null, created_by: null }), error: null });

    await saveSchedule({ year: 2026, month: 8, seed: 5, overrides: {} }, client);

    expect(calls.insert).toEqual([
      { year: 2026, month: 8, seed: 5, overrides: {}, label: null, created_by: null },
    ]);
  });

  it("blank label collapses to null", async () => {
    const { client, calls } = makeClient({ data: row({ label: null }), error: null });

    await saveSchedule({ year: 2026, month: 8, seed: 5, overrides: {}, label: "   " }, client);

    expect((calls.insert[0] as { label: unknown }).label).toBeNull();
  });

  it("throws on a data-access error", async () => {
    const { client } = makeClient({ data: null, error: { message: "denied" } });
    await expect(saveSchedule({ year: 2026, month: 7, seed: 1, overrides: {} }, client)).rejects.toThrow(/denied/);
  });
});

describe("listSchedules", () => {
  it("returns saved schedules newest-first", async () => {
    const rows = [row({ id: "b" }), row({ id: "a" })];
    const { client, calls } = makeClient({ data: rows, error: null });

    const result = await listSchedules(client);

    expect(result).toEqual(rows);
    expect(calls.from).toEqual(["schedules"]);
    expect(calls.order).toEqual([["created_at", { ascending: false }]]);
  });

  it("returns an empty array when there are no rows", async () => {
    const { client } = makeClient({ data: null, error: null });
    expect(await listSchedules(client)).toEqual([]);
  });

  it("throws on a data-access error", async () => {
    const { client } = makeClient({ data: null, error: { message: "boom" } });
    await expect(listSchedules(client)).rejects.toThrow(/boom/);
  });
});

describe("deleteSchedule", () => {
  it("deletes by id", async () => {
    const { client, calls } = makeClient({ data: null, error: null });

    await deleteSchedule("sched-1", client);

    expect(calls.from).toEqual(["schedules"]);
    expect(calls.delete).toBe(1);
    expect(calls.eq).toEqual([["id", "sched-1"]]);
  });

  it("throws on a data-access error", async () => {
    const { client } = makeClient({ data: null, error: { message: "nope" } });
    await expect(deleteSchedule("sched-1", client)).rejects.toThrow(/nope/);
  });
});
