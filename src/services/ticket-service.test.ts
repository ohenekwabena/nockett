import { describe, it, expect, vi } from "vitest";

// ticket-service instantiates a Supabase client and pulls in the notifications
// module at import time; stub both so the pure normalizer can be imported.
vi.mock("@/api/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/ticket-notifications", () => ({
  notifyTicketCreated: vi.fn(),
  notifyTicketStatusChanged: vi.fn(),
}));

import { normalizeTicketRow } from "./ticket-service";

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
