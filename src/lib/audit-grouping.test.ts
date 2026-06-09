import { describe, it, expect } from "vitest";
import { groupEventsByTxid } from "./audit-grouping";
import type { AuditEvent } from "./audit-service";

/** Build an Audit Event with sensible defaults; pass id + txid, override the rest. */
function event(over: Partial<AuditEvent> & Pick<AuditEvent, "id" | "txid">): AuditEvent {
  return {
    created_at: "2026-06-09T10:00:00Z",
    entity_type: "tickets",
    entity_id: `e-${over.id}`,
    action: "update",
    actor_id: null,
    actor_email: null,
    actor_name: null,
    changes: {},
    ...over,
  };
}

/**
 * A Ticket cascade delete: the parent `tickets` row plus three child rows that
 * each carry the parent id as `ticket_id` in their captured `changes`, all under
 * one txid. Built parent-LAST in feed order so the tests prove the primary is
 * chosen by FK reference, not merely by position.
 */
function ticketCascade(txid: number): AuditEvent[] {
  return [
    event({ id: 104, txid, action: "delete", entity_type: "ticket_comments", entity_id: "c-104", changes: { id: 104, ticket_id: "ticket-A", content: "hi" } }),
    event({ id: 103, txid, action: "delete", entity_type: "ticket_notes", entity_id: "n-103", changes: { id: 103, ticket_id: "ticket-A" } }),
    event({ id: 102, txid, action: "delete", entity_type: "ticket_attachments", entity_id: "a-102", changes: { id: 102, ticket_id: "ticket-A", filename: "f.pdf" } }),
    event({ id: 101, txid, action: "delete", entity_type: "tickets", entity_id: "ticket-A", changes: { id: "ticket-A", title: "T" } }),
  ];
}

describe("groupEventsByTxid", () => {
  it("returns no groups for an empty feed", () => {
    expect(groupEventsByTxid([])).toEqual([]);
  });

  it("keeps each distinct-txid event as its own single-event group", () => {
    const feed = [
      event({ id: 9, txid: 900, entity_type: "users", action: "update", changes: { role: { old: "user", new: "admin" } } }),
      event({ id: 8, txid: 800, entity_type: "invites", action: "insert" }),
      event({ id: 7, txid: 700, entity_type: "sites", action: "delete" }),
    ];

    const groups = groupEventsByTxid(feed);

    expect(groups.map((group) => group.key)).toEqual([9, 8, 7]);
    for (const group of groups) {
      expect(group.events).toHaveLength(1);
      expect(group.related).toEqual([]);
      expect(group.primary).toBe(group.events[0]);
    }
  });

  it("collapses a same-txid cascade burst into one group, parent as primary", () => {
    const groups = groupEventsByTxid(ticketCascade(500));

    expect(groups).toHaveLength(1);
    const [group] = groups;
    expect(group.txid).toBe(500);
    // parent identified by the three children referencing its id, not by position
    expect(group.primary.entity_type).toBe("tickets");
    expect(group.primary.entity_id).toBe("ticket-A");
    expect(group.key).toBe(group.primary.id);
    // every member retained, in feed order
    expect(group.events.map((event) => event.id)).toEqual([104, 103, 102, 101]);
    // the related rows are the members minus the primary, order preserved
    expect(group.related.map((event) => event.id)).toEqual([104, 103, 102]);
  });

  it("groups by *consecutive* txid, so a singleton between two bursts splits them", () => {
    const feed = [
      event({ id: 200, txid: 50, entity_type: "departments", action: "insert" }),
      ...ticketCascade(40),
      event({ id: 30, txid: 30, entity_type: "links", action: "update" }),
    ];

    const groups = groupEventsByTxid(feed);

    expect(groups.map((group) => group.events.length)).toEqual([1, 4, 1]);
    expect(groups.map((group) => group.txid)).toEqual([50, 40, 30]);
  });

  it("never merges non-consecutive runs that happen to share a txid", () => {
    // A reused txid split by a different txid stays two groups (e.g. a feed cut
    // across a pagination boundary), never one global bucket.
    const feed = [
      event({ id: 3, txid: 77 }),
      event({ id: 2, txid: 88 }),
      event({ id: 1, txid: 77 }),
    ];

    const groups = groupEventsByTxid(feed);

    expect(groups.map((group) => group.key)).toEqual([3, 2, 1]);
  });

  it("falls back to the first feed event as primary when nothing is referenced", () => {
    // Two rows share a txid but neither carries the other's id — no parent to find.
    const feed = [
      event({ id: 61, txid: 600, entity_type: "ticket_categories", action: "insert", entity_id: "x" }),
      event({ id: 60, txid: 600, entity_type: "ticket_priorities", action: "insert", entity_id: "y" }),
    ];

    const groups = groupEventsByTxid(feed);

    expect(groups).toHaveLength(1);
    expect(groups[0].primary.id).toBe(61);
    expect(groups[0].related.map((event) => event.id)).toEqual([60]);
  });
});
