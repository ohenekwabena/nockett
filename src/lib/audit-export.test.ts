import { describe, it, expect } from "vitest";
import {
  AUDIT_EXPORT_HEADERS,
  auditEventToRow,
  formatAuditTimestamp,
  summarizeChanges,
} from "./audit-export";
import type { AuditEvent } from "./audit-service";

// audit-export only type-imports audit-service (erased at runtime), so unlike
// audit-service.test this needs no supabase-client mock — it is pure.

function event(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 1,
    created_at: "2026-06-09T05:00:00Z",
    txid: 101,
    entity_type: "tickets",
    entity_id: "ticket-1",
    action: "update",
    actor_id: "user-1",
    actor_email: "admin@example.com",
    actor_name: "Admin User",
    changes: {},
    ...overrides,
  };
}

describe("auditEventToRow", () => {
  it("maps an event to columns aligned with AUDIT_EXPORT_HEADERS", () => {
    const row = auditEventToRow(
      event({ changes: { status: { old: "OPEN", new: "CLOSED" } } }),
    );

    expect(row).toHaveLength(AUDIT_EXPORT_HEADERS.length);
    expect(row).toEqual([
      "2026-06-09 05:00:00 UTC",
      "Admin User",
      "admin@example.com",
      "update",
      "tickets",
      "ticket-1",
      "status: OPEN → CLOSED",
    ]);
  });

  it("renders absent actor / entity / action fields as empty cells", () => {
    const row = auditEventToRow(
      event({ actor_name: null, actor_email: null, action: null, entity_id: null }),
    );

    expect(row[1]).toBe(""); // actor name
    expect(row[2]).toBe(""); // actor email
    expect(row[3]).toBe(""); // action
    expect(row[5]).toBe(""); // entity id
  });
});

describe("summarizeChanges", () => {
  it("renders an update diff as 'col: old → new', joined by '; '", () => {
    const summary = summarizeChanges(
      event({
        action: "update",
        changes: {
          status: { old: "OPEN", new: "CLOSED" },
          assignee_id: { old: null, new: "u2" },
        },
      }),
    );

    expect(summary).toBe("status: OPEN → CLOSED; assignee_id: null → u2");
  });

  it("renders an insert snapshot as flat 'col: value' pairs", () => {
    const summary = summarizeChanges(
      event({
        action: "insert",
        changes: { id: "t1", title: "Fibre cut", grossDowntimeMin: 45, slaImpacted: true, notes: null },
      }),
    );

    expect(summary).toBe("id: t1; title: Fibre cut; grossDowntimeMin: 45; slaImpacted: true; notes: null");
  });

  it("renders a delete snapshot the same flat way as insert", () => {
    const summary = summarizeChanges(
      event({ action: "delete", changes: { id: "t9", title: "Removed" } }),
    );

    expect(summary).toBe("id: t9; title: Removed");
  });

  it("JSON-encodes nested object values", () => {
    const summary = summarizeChanges(
      event({ action: "insert", changes: { payload: { a: 1, b: ["x"] } } }),
    );

    expect(summary).toBe('payload: {"a":1,"b":["x"]}');
  });

  it("returns '' for an empty, null, or non-object payload", () => {
    expect(summarizeChanges(event({ changes: {} }))).toBe("");
    expect(summarizeChanges(event({ changes: null }))).toBe("");
    expect(summarizeChanges(event({ changes: ["not", "an", "object"] }))).toBe("");
  });
});

describe("formatAuditTimestamp", () => {
  it("formats an ISO instant as a stable UTC string regardless of local zone", () => {
    expect(formatAuditTimestamp("2026-06-09T05:07:09Z")).toBe("2026-06-09 05:07:09 UTC");
    // A non-Z offset is normalized to UTC, not left in local time.
    expect(formatAuditTimestamp("2026-01-01T00:30:00+02:00")).toBe("2025-12-31 22:30:00 UTC");
  });

  it("falls back to the raw input when it cannot be parsed", () => {
    expect(formatAuditTimestamp("not-a-date")).toBe("not-a-date");
  });
});
