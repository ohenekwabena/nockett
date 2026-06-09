import { describe, it, expect, vi } from "vitest";

// ticket-service instantiates a Supabase client and pulls in the notifications
// module at import time; stub both so the pure normalizer can be imported.
vi.mock("@/api/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/ticket-notifications", () => ({
  notifyTicketCreated: vi.fn(),
  notifyTicketStatusChanged: vi.fn(),
}));

import { normalizeTicketRow, TicketService } from "./ticket-service";

describe("normalizeTicketRow", () => {
  it("collapses array-shaped joins to single objects", () => {
    const t = normalizeTicketRow({
      id: "t1",
      title: "x",
      status: "OPEN",
      ticket_categories: [{ id: 1, name: "Network" }],
      ticket_priorities: [{ id: 2, name: "High" }],
      assignee: [{ id: 3, name: "Ada" }],
      users: [{ id: "u1", name: "Ada", email: "ada@example.com" }],
    });

    expect(t.ticket_categories).toEqual({ id: 1, name: "Network" });
    expect(t.ticket_priorities).toEqual({ id: 2, name: "High" });
    expect(t.assignee).toEqual({ id: 3, name: "Ada" });
    expect(t.users).toEqual({ id: "u1", name: "Ada", email: "ada@example.com" });
  });

  it("passes object-shaped joins through unchanged", () => {
    const t = normalizeTicketRow({
      id: "t1",
      title: "x",
      status: "OPEN",
      ticket_priorities: { id: 2, name: "High" },
      assignee: { id: 3, name: "Ada" },
    });

    expect(t.ticket_priorities).toEqual({ id: 2, name: "High" });
    expect(t.assignee).toEqual({ id: 3, name: "Ada" });
  });

  it("normalizes empty/missing joins to null", () => {
    const t = normalizeTicketRow({
      id: "t1",
      title: "x",
      status: "OPEN",
      ticket_categories: [],
      ticket_priorities: null,
      assignee: undefined,
    });

    expect(t.ticket_categories).toBeNull();
    expect(t.ticket_priorities).toBeNull();
    expect(t.assignee).toBeNull();
    expect(t.users).toBeNull();
  });

  it("preserves the ticket's own scalar fields", () => {
    const t = normalizeTicketRow({ id: "t1", title: "Outage", status: "OPEN", assignee_id: 3 });
    expect(t.id).toBe("t1");
    expect(t.title).toBe("Outage");
    expect(t.status).toBe("OPEN");
    expect(t.assignee_id).toBe(3);
  });
});

/**
 * A chainable PostgREST-builder stub for the getTicketIdByNumber path:
 * from(...).select(...).eq(...).maybeSingle(). Records args and resolves
 * maybeSingle() to the configured { data, error }.
 */
function makeClient(response: { data: unknown; error: unknown }) {
  const calls = {
    from: [] as string[],
    select: [] as string[],
    eq: [] as Array<[string, unknown]>,
  };
  const builder: Record<string, unknown> = {
    select: vi.fn((columns: string) => {
      calls.select.push(columns);
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      calls.eq.push([column, value]);
      return builder;
    }),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
  };
  const from = vi.fn((table: string) => {
    calls.from.push(table);
    return builder;
  });
  return { client: { from }, calls };
}

/** A TicketService with its private client swapped for the stub (mirrors audit-service's injected-client tests). */
function service(response: { data: unknown; error: unknown }) {
  const svc = new TicketService();
  const { client, calls } = makeClient(response);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (svc as any).supabase = client;
  return { svc, calls };
}

describe("getTicketIdByNumber", () => {
  it("resolves a Ticket Number to its uuid by matching the ticket_id column", async () => {
    const { svc, calls } = service({ data: { id: "uuid-123" }, error: null });

    const id = await svc.getTicketIdByNumber("Ticket#20260609001");

    expect(id).toBe("uuid-123");
    expect(calls.from).toEqual(["tickets"]);
    expect(calls.select).toEqual(["id"]);
    // ADR-0003 notwithstanding, the live human identifier lives in `ticket_id`.
    expect(calls.eq).toEqual([["ticket_id", "Ticket#20260609001"]]);
  });

  it("trims surrounding whitespace before matching", async () => {
    const { svc, calls } = service({ data: { id: "uuid-1" }, error: null });

    await svc.getTicketIdByNumber("  Ticket#20260609001  ");

    expect(calls.eq).toEqual([["ticket_id", "Ticket#20260609001"]]);
  });

  it("returns null when no Ticket carries that number (maybeSingle -> data null)", async () => {
    const { svc } = service({ data: null, error: null });

    expect(await svc.getTicketIdByNumber("Ticket#does-not-exist")).toBeNull();
  });

  it("returns null for blank input without querying", async () => {
    const { svc, calls } = service({ data: null, error: null });

    expect(await svc.getTicketIdByNumber("   ")).toBeNull();
    expect(calls.from).toEqual([]);
  });

  it("throws (unwrapped) when the read errors", async () => {
    const { svc } = service({ data: null, error: { message: "boom" } });

    await expect(svc.getTicketIdByNumber("Ticket#20260609001")).rejects.toThrow(/boom/);
  });
});
