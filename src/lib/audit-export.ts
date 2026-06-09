import type { AuditEvent } from "@/lib/audit-service";

/**
 * Pure, dependency-free row-shaping for the Audit Log Excel export (AUDIT-6).
 *
 * Kept separate from export-service (which owns the ExcelJS plumbing) and
 * React-free like audit-filters / audit-grouping, so the row transform and the
 * change-summary rendering are unit-testable without a workbook or the DOM.
 *
 * `ExportService.exportAuditEventsToExcel` writes {@link AUDIT_EXPORT_HEADERS}
 * as the sheet header and feeds each event through {@link auditEventToRow},
 * reusing its own setupHeaders / autoFitColumns / downloadWorkbook helpers.
 */

/** Export columns, in order. Mirrors {@link auditEventToRow}'s output. */
export const AUDIT_EXPORT_HEADERS = [
  "Timestamp",
  "Actor Name",
  "Actor Email",
  "Action",
  "Entity Type",
  "Entity ID",
  "Change Summary",
];

/**
 * One Audit Event as an Excel row, column-aligned with {@link AUDIT_EXPORT_HEADERS}.
 * Every cell is a string so the sheet round-trips predictably; absent data is "".
 */
export function auditEventToRow(event: AuditEvent): string[] {
  return [
    formatAuditTimestamp(event.created_at),
    event.actor_name ?? "",
    event.actor_email ?? "",
    event.action ?? "",
    event.entity_type ?? "",
    event.entity_id ?? "",
    summarizeChanges(event),
  ];
}

/**
 * Render the captured `changes` payload as one readable line.
 *
 * The DB trigger (migration 017) shapes `changes` by action:
 *   - update        -> { col: { old, new } } per changed column -> "col: old → new"
 *   - insert/delete -> the full row snapshot { col: value }      -> "col: value"
 * Entries join with "; ". A null/non-object/empty payload yields "".
 */
export function summarizeChanges(event: AuditEvent): string {
  const { changes } = event;
  if (changes == null || typeof changes !== "object" || Array.isArray(changes)) return "";

  const entries = Object.entries(changes as Record<string, unknown>);
  if (entries.length === 0) return "";

  if (event.action === "update") {
    return entries.map(([column, diff]) => `${column}: ${formatDiff(diff)}`).join("; ");
  }
  // insert | delete (and any non-update action): the payload is a flat row snapshot.
  return entries.map(([column, value]) => `${column}: ${formatValue(value)}`).join("; ");
}

/** A column's `{ old, new }` diff as "old → new"; tolerates a non-diff value. */
function formatDiff(diff: unknown): string {
  if (diff && typeof diff === "object" && !Array.isArray(diff) && "old" in diff && "new" in diff) {
    const { old: oldValue, new: newValue } = diff as { old: unknown; new: unknown };
    return `${formatValue(oldValue)} → ${formatValue(newValue)}`;
  }
  return formatValue(diff);
}

/** Render a captured scalar / JSON value compactly for a spreadsheet cell. */
function formatValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Format an ISO instant as "YYYY-MM-DD HH:MM:SS UTC". UTC rather than local time
 * keeps the value stable across machines and timezones — what a retention export
 * wants, and what makes the unit test deterministic. Falls back to the raw input
 * when it cannot be parsed.
 */
export function formatAuditTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
  );
}
