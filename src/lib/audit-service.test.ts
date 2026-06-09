import { describe, it, expect, vi, beforeEach } from "vitest";

// audit-service lazily creates a browser client only when no client is injected.
// Every test injects its own client, so this mock just keeps the import safe.
vi.mock("@/api/supabase/client", () => ({ createClient: () => ({ from: vi.fn() }) }));

import { listEvents, type AuditEvent } from "./audit-service";

/**
 * A chainable, awaitable PostgREST-builder stub. Chainable methods record their
 * args and return the builder; `await`ing the builder resolves to the configured
 * { data, error } (the builder is a thenable, like the real query builder).
 */
function makeClient(response: { data: unknown; error: unknown }) {
  const calls = {
    from: [] as string[],
    select: [] as string[],
    order: [] as Array<[string, unknown]>,
    limit: [] as number[],
    or: [] as string[],
  };
  const builder: Record<string, unknown> = {
    select: vi.fn((columns: string) => {
      calls.select.push(columns);
      return builder;
    }),
    order: vi.fn((column: string, options: unknown) => {
      calls.order.push([column, options]);
      return builder;
    }),
    limit: vi.fn((count: number) => {
      calls.limit.push(count);
      return builder;
    }),
    or: vi.fn((filter: string) => {
      calls.or.push(filter);
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

function row(id: number, created_at: string): AuditEvent {
  return {
    id,
    created_at,
    txid: 100 + id,
    entity_type: "tickets",
    entity_id: `ticket-${id}`,
    action: "update",
    actor_id: null,
    actor_email: null,
    actor_name: null,
    changes: {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listEvents", () => {
  it("queries audit_log newest-first and fetches one extra row to detect more", async () => {
    const { client, calls } = makeClient({ data: [row(3, "2026-06-09T03:00:00Z")], error: null });

    await listEvents({ limit: 10 }, client);

    expect(calls.from).toEqual(["audit_log"]);
    expect(calls.order).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    // limit + 1, so a full page tells us whether a further page exists.
    expect(calls.limit).toEqual([11]);
  });

  it("returns unwrapped events and a nextCursor when a further page exists", async () => {
    // limit 2 -> fetches 3; the 3rd row signals "more", so it is trimmed off.
    const data = [
      row(5, "2026-06-09T05:00:00Z"),
      row(4, "2026-06-09T04:00:00Z"),
      row(3, "2026-06-09T03:00:00Z"),
    ];
    const { client } = makeClient({ data, error: null });

    const result = await listEvents({ limit: 2 }, client);

    expect(result.events.map((event) => event.id)).toEqual([5, 4]);
    expect(result.nextCursor).toEqual({ created_at: "2026-06-09T04:00:00Z", id: 4 });
  });

  it("returns all rows and a null nextCursor on the final (partial) page", async () => {
    const data = [row(2, "2026-06-09T02:00:00Z"), row(1, "2026-06-09T01:00:00Z")];
    const { client } = makeClient({ data, error: null });

    const result = await listEvents({ limit: 2 }, client);

    expect(result.events.map((event) => event.id)).toEqual([2, 1]);
    expect(result.nextCursor).toBeNull();
  });

  it("applies the strict keyset predicate only when a cursor is supplied", async () => {
    const { client, calls } = makeClient({ data: [], error: null });

    await listEvents({ limit: 2, cursor: { created_at: "2026-06-09T04:00:00Z", id: 4 } }, client);

    expect(calls.or).toEqual([
      "created_at.lt.2026-06-09T04:00:00Z,and(created_at.eq.2026-06-09T04:00:00Z,id.lt.4)",
    ]);
  });

  it("omits the keyset predicate on the first page", async () => {
    const { client, calls } = makeClient({ data: [], error: null });

    await listEvents({ limit: 2 }, client);

    expect(calls.or).toEqual([]);
  });

  it("throws (unwrapped) when the read errors", async () => {
    const { client } = makeClient({ data: null, error: { message: "boom" } });

    await expect(listEvents({ limit: 2 }, client)).rejects.toThrow(/boom/);
  });
});
