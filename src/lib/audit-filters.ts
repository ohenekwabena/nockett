import type { AuditFilters } from "@/lib/audit-service";

/**
 * Pure, React-free filter helpers for the Audit Log (AUDIT-3). Split out like
 * audit-grouping so the filter-bar's state, the calendar-day → instant widening,
 * and the UI → read-seam mapping are unit-testable without rendering anything.
 */

/** The slice of a User the actor dropdown needs (reuses the app's users read). */
export interface AuditActor {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * The filter-bar's own state. Plain strings so each control is trivially
 * controlled; "" means "no constraint". Dates are calendar days ("YYYY-MM-DD")
 * as the native date input emits them, interpreted in the Admin's local zone.
 */
export interface AuditFilterState {
  /** Inclusive lower-bound day, "YYYY-MM-DD", or "". */
  from: string;
  /** Inclusive upper-bound day, "YYYY-MM-DD", or "". */
  to: string;
  /** Exact actor id (users.id), or "" for any actor. */
  actorId: string;
  /** Exact entity type (audited table name), or "" for any. */
  entityType: string;
  /** Exact action (insert|update|delete), or "" for any. */
  action: string;
  /** Free-text search over the change payload (AUDIT-5), or "" for no search. */
  search: string;
}

/** The no-constraint state: the full log. */
export const EMPTY_AUDIT_FILTERS: AuditFilterState = {
  from: "",
  to: "",
  actorId: "",
  entityType: "",
  action: "",
  search: "",
};

/** True when any constraint is set — drives the reset affordance and "filtered" label. */
export function hasActiveFilters(state: AuditFilterState): boolean {
  return Boolean(
    state.from || state.to || state.actorId || state.entityType || state.action || state.search.trim(),
  );
}

/**
 * Map the filter-bar state to the read seam's {@link AuditFilters}. The two date
 * inputs are calendar days, so widen each to the instant the seam compares
 * against: `from` to the day's first instant, `to` to its last — that way an
 * inclusive "1 Jun → 9 Jun" range catches every Audit Event on the 9th rather
 * than stopping at its midnight. Empty controls map to null (no constraint); the
 * search box is trimmed so trailing whitespace never counts as a query.
 */
export function toServiceFilters(state: AuditFilterState): AuditFilters {
  return {
    createdFrom: state.from ? startOfLocalDayIso(state.from) : null,
    createdTo: state.to ? endOfLocalDayIso(state.to) : null,
    actorId: state.actorId || null,
    entityType: state.entityType || null,
    action: state.action || null,
    search: state.search.trim() || null,
  };
}

/** First instant of a "YYYY-MM-DD" calendar day in local time, as an ISO (UTC) string. */
export function startOfLocalDayIso(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/** Last instant of a "YYYY-MM-DD" calendar day in local time, as an ISO (UTC) string. */
export function endOfLocalDayIso(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/** Display an enum-ish value ("ticket_comments", "insert") as a label ("Ticket comments", "Insert"). */
export function humanizeLabel(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
