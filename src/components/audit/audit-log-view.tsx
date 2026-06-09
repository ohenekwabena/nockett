"use client";

import { useState } from "react";
import { listEvents, type AuditCursor, type AuditEvent } from "@/lib/audit-service";

interface AuditLogViewProps {
  initialEvents: AuditEvent[];
  initialCursor: AuditCursor | null;
  pageSize: number;
}

const ACTION_BADGE: Record<string, string> = {
  insert: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  update: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatTimestamp(iso: string): string {
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

/**
 * The Admin-only Audit Log surface. Server-rendered with the first (newest)
 * page; "Load more" walks older Audit Events via the keyset read seam. Capture
 * lands by DB trigger (ADR-0004), so this view never writes — it only reads.
 */
export function AuditLogView({ initialEvents, initialCursor, pageSize }: AuditLogViewProps) {
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents);
  const [cursor, setCursor] = useState<AuditCursor | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listEvents({ limit: pageSize, cursor });
      setEvents((previous) => [...previous, ...result.events]);
      setCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more Audit Events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-6 mt-10">
      <div className="mb-8">
        <h1
          className="text-6xl font-bold text-gray-900 dark:text-white mb-2"
          style={{ fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)" }}
        >
          Audit Log
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {events.length} Audit Event{events.length === 1 ? "" : "s"} shown, newest first
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No Audit Events yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Changes to Tickets will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const actorPrimary = event.actor_name || event.actor_email || "System";
                const actorSecondary =
                  event.actor_name && event.actor_email ? event.actor_email : null;
                return (
                  <tr
                    key={event.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {formatTimestamp(event.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 dark:text-gray-100">{actorPrimary}</span>
                      {actorSecondary && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {actorSecondary}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ACTION_BADGE[event.action ?? ""] ??
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {event.action ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 dark:text-gray-100">{event.entity_type}</span>
                      {event.entity_id && (
                        <span
                          className="block text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[16rem]"
                          title={event.entity_id}
                        >
                          {event.entity_id}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
