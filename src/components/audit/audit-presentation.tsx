import type { AuditEvent } from "@/lib/audit-service";

/**
 * Shared presentational atoms for an Audit Event. Used by both the main log feed
 * (audit-log-view) and the entity drill-down trail (entity-trail-dialog), so the
 * timestamp format and the action/actor styling stay identical across the two
 * surfaces (AUDIT-4). Pure and prop-driven — no query or paging state.
 */

const ACTION_BADGE: Record<string, string> = {
  insert: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  update: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/** Render an ISO instant in the Admin's locale, 24-hour, to the second; falls back to the raw string if unparseable. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** A pill coloring the action (insert/update/delete); an unknown/absent action gets a neutral pill. */
export function ActionBadge({ action }: { action: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ACTION_BADGE[action ?? ""] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {action ?? "—"}
    </span>
  );
}

/** The acting User: name over email when both exist; "System" for trigger/seed writes with no actor. */
export function ActorCell({ event }: { event: AuditEvent }) {
  const primary = event.actor_name || event.actor_email || "System";
  const secondary = event.actor_name && event.actor_email ? event.actor_email : null;
  return (
    <>
      <span className="text-gray-900 dark:text-gray-100">{primary}</span>
      {secondary && (
        <span className="block text-xs text-gray-500 dark:text-gray-400">{secondary}</span>
      )}
    </>
  );
}
