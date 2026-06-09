import { describe, it, expect } from "vitest";
import {
  EMPTY_AUDIT_FILTERS,
  endOfLocalDayIso,
  hasActiveFilters,
  humanizeLabel,
  startOfLocalDayIso,
  toServiceFilters,
  type AuditFilterState,
} from "./audit-filters";

describe("toServiceFilters", () => {
  it("maps the empty state to all-null (the full log)", () => {
    expect(toServiceFilters(EMPTY_AUDIT_FILTERS)).toEqual({
      createdFrom: null,
      createdTo: null,
      actorId: null,
      entityType: null,
      action: null,
      search: null,
    });
  });

  it("passes actor, entity type, and action through unchanged", () => {
    const state: AuditFilterState = {
      from: "",
      to: "",
      actorId: "user-1",
      entityType: "tickets",
      action: "update",
      search: "",
    };
    const result = toServiceFilters(state);
    expect(result.actorId).toBe("user-1");
    expect(result.entityType).toBe("tickets");
    expect(result.action).toBe("update");
  });

  it("trims the search term and maps blank to null (AUDIT-5)", () => {
    expect(toServiceFilters({ ...EMPTY_AUDIT_FILTERS, search: "  CLOSED  " }).search).toBe("CLOSED");
    expect(toServiceFilters({ ...EMPTY_AUDIT_FILTERS, search: "   " }).search).toBeNull();
    expect(toServiceFilters(EMPTY_AUDIT_FILTERS).search).toBeNull();
  });

  it("widens the date range to the full local day (from-start, to-end)", () => {
    const result = toServiceFilters({ ...EMPTY_AUDIT_FILTERS, from: "2026-06-01", to: "2026-06-09" });

    // Re-parse and read LOCAL components so the assertion holds in any timezone.
    const from = new Date(result.createdFrom as string);
    expect([from.getFullYear(), from.getMonth(), from.getDate()]).toEqual([2026, 5, 1]);
    expect([from.getHours(), from.getMinutes(), from.getSeconds(), from.getMilliseconds()]).toEqual([0, 0, 0, 0]);

    const to = new Date(result.createdTo as string);
    expect([to.getFullYear(), to.getMonth(), to.getDate()]).toEqual([2026, 5, 9]);
    expect([to.getHours(), to.getMinutes(), to.getSeconds(), to.getMilliseconds()]).toEqual([23, 59, 59, 999]);
  });

  it("leaves the other date bound null when only one is set", () => {
    expect(toServiceFilters({ ...EMPTY_AUDIT_FILTERS, from: "2026-06-01" }).createdTo).toBeNull();
    expect(toServiceFilters({ ...EMPTY_AUDIT_FILTERS, to: "2026-06-09" }).createdFrom).toBeNull();
  });
});

describe("day boundary helpers", () => {
  it("startOfLocalDayIso is the first instant of the local day", () => {
    const d = new Date(startOfLocalDayIso("2026-06-09"));
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });

  it("endOfLocalDayIso is the last instant of the local day", () => {
    const d = new Date(endOfLocalDayIso("2026-06-09"));
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([23, 59, 59, 999]);
  });

  it("end is strictly after start for the same day", () => {
    expect(endOfLocalDayIso("2026-06-09") > startOfLocalDayIso("2026-06-09")).toBe(true);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty state", () => {
    expect(hasActiveFilters(EMPTY_AUDIT_FILTERS)).toBe(false);
  });

  it("is true when any single field is set", () => {
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, from: "2026-06-01" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, to: "2026-06-09" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, actorId: "user-1" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, entityType: "tickets" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, action: "delete" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, search: "CLOSED" })).toBe(true);
  });

  it("ignores a whitespace-only search (not an active filter)", () => {
    expect(hasActiveFilters({ ...EMPTY_AUDIT_FILTERS, search: "   " })).toBe(false);
  });
});

describe("humanizeLabel", () => {
  it("title-cases and de-underscores a value", () => {
    expect(humanizeLabel("ticket_comments")).toBe("Ticket comments");
    expect(humanizeLabel("insert")).toBe("Insert");
    expect(humanizeLabel("service_types")).toBe("Service types");
  });
});
