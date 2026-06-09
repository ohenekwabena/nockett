"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { listEvents, type AuditCursor, type AuditEvent } from "@/lib/audit-service";
import { groupEventsByTxid } from "@/lib/audit-grouping";
import { ExportService } from "@/lib/export-service";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import {
  EMPTY_AUDIT_FILTERS,
  hasActiveFilters,
  toServiceFilters,
  type AuditActor,
  type AuditFilterState,
} from "@/lib/audit-filters";

interface AuditLogViewProps {
  initialEvents: AuditEvent[];
  initialCursor: AuditCursor | null;
  pageSize: number;
  /** Actors for the filter dropdown (all Users; reuses the app's users read). */
  actors: AuditActor[];
}

// Export pulls the whole filtered set into the client by walking the keyset
// pages; a wide page size keeps that to few round-trips. (For very large logs a
// server-side streaming export would replace this — out of scope, see AUDIT-6.)
const EXPORT_BATCH_SIZE = 1000;

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

function ActionBadge({ action }: { action: string | null }) {
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

function ActorCell({ event }: { event: AuditEvent }) {
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

function EntityLabel({ event }: { event: AuditEvent }) {
  return (
    <>
      <span className="text-gray-900 dark:text-gray-100">{event.entity_type}</span>
      {event.entity_id && (
        <span
          className="block text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[16rem]"
          title={event.entity_id}
        >
          {event.entity_id}
        </span>
      )}
    </>
  );
}

/**
 * The Admin-only Audit Log surface. Server-rendered with the first (newest)
 * page; "Load more" walks older Audit Events via the keyset read seam. Capture
 * lands by DB trigger (ADR-0004), so this view never writes — it only reads.
 *
 * A cascade burst (e.g. deleting a Ticket, whose comments/notes/attachments
 * cascade in the same transaction) shares one txid, so the feed is collapsed
 * into per-txid groups: a multi-row group shows its parent with a "+N related
 * rows" disclosure that expands to reveal the child Audit Events (AUDIT-2).
 *
 * The filter bar (AUDIT-3) narrows by date range, actor, entity type, and
 * action. Any change re-queries page one through the same keyset seam, so the
 * active filters govern both the results and every subsequent "Load more".
 */
export function AuditLogView({ initialEvents, initialCursor, pageSize, actors }: AuditLogViewProps) {
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents);
  const [cursor, setCursor] = useState<AuditCursor | null>(initialCursor);
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Monotonic id stamped on every fetch: a slower earlier response (e.g. the user
  // re-filters mid-load) is discarded so only the newest query wins the state.
  const requestRef = useRef(0);

  const groups = useMemo(() => groupEventsByTxid(events), [events]);
  const filtered = hasActiveFilters(filters);

  const toggle = (key: number) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Re-query the first (newest) page under a new filter set. Resets the feed and
  // cursor, so pagination continues within the active filters.
  const applyFilters = async (next: AuditFilterState) => {
    const requestId = ++requestRef.current;
    setFilters(next);
    setLoading(true);
    setError(null);
    try {
      const result = await listEvents({ limit: pageSize, filters: toServiceFilters(next) });
      if (requestRef.current !== requestId) return; // superseded by a newer query
      setEvents(result.events);
      setCursor(result.nextCursor);
      setExpanded(new Set());
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Failed to filter Audit Events");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  };

  const resetFilters = () => applyFilters(EMPTY_AUDIT_FILTERS);

  const loadMore = async () => {
    if (!cursor || loading) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      // Carry the active filters so older pages stay within the same slice.
      const result = await listEvents({ limit: pageSize, cursor, filters: toServiceFilters(filters) });
      if (requestRef.current !== requestId) return; // a filter change superseded this page
      setEvents((previous) => [...previous, ...result.events]);
      setCursor(result.nextCursor);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Failed to load more Audit Events");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  };

  // Export the whole active-filter result set to .xlsx. We re-walk the keyset
  // pages from the top (not just the rows already loaded) so the file is the
  // complete filtered log, then hand the rows to the shared ExportService.
  const exportEvents = async () => {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const serviceFilters = toServiceFilters(filters);
      const all: AuditEvent[] = [];
      let pageCursor: AuditCursor | null = null;
      do {
        const page = await listEvents({ limit: EXPORT_BATCH_SIZE, cursor: pageCursor, filters: serviceFilters });
        all.push(...page.events);
        pageCursor = page.nextCursor;
      } while (pageCursor);

      if (all.length > 0) {
        await ExportService.exportAuditEventsToExcel(all, "audit-log-export.xlsx");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export Audit Events");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="pr-6 mt-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-6xl font-bold text-gray-900 dark:text-white mb-2"
            style={{ fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)" }}
          >
            Audit Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {events.length} Audit Event{events.length === 1 ? "" : "s"} shown, newest first
            {filtered ? " · filtered" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={exportEvents}
          disabled={exporting || loading || events.length === 0}
          title="Export the current filtered Audit Log to Excel"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </button>
      </div>

      <AuditFilterBar
        filters={filters}
        actors={actors}
        disabled={loading || exporting}
        onChange={applyFilters}
        onReset={resetFilters}
      />

      {events.length === 0 ? (
        <div className="text-center py-12">
          {filtered ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No Audit Events match these filters
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Try widening the date range or clearing a filter.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">No Audit Events yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Changes across the app will appear here as they happen.
              </p>
            </>
          )}
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
              {groups.map((group) => {
                const isGroup = group.related.length > 0;
                const isOpen = expanded.has(group.key);
                return (
                  <Fragment key={group.key}>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {formatTimestamp(group.primary.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <ActorCell event={group.primary} />
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={group.primary.action} />
                      </td>
                      <td className="px-4 py-3">
                        {isGroup ? (
                          <button
                            type="button"
                            onClick={() => toggle(group.key)}
                            aria-expanded={isOpen}
                            className="flex items-start gap-2 text-left hover:opacity-80 transition-opacity"
                          >
                            <span
                              aria-hidden
                              className="mt-0.5 text-gray-400 dark:text-gray-500 select-none"
                            >
                              {isOpen ? "▾" : "▸"}
                            </span>
                            <span>
                              <EntityLabel event={group.primary} />
                              <span className="block text-xs text-blue-600 dark:text-blue-400">
                                +{group.related.length} related row
                                {group.related.length === 1 ? "" : "s"}
                              </span>
                            </span>
                          </button>
                        ) : (
                          <EntityLabel event={group.primary} />
                        )}
                      </td>
                    </tr>
                    {isGroup &&
                      isOpen &&
                      group.related.map((child) => (
                        <tr
                          key={child.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 bg-gray-50/60 dark:bg-gray-900/20"
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {formatTimestamp(child.created_at)}
                          </td>
                          <td className="px-4 py-2">
                            <ActorCell event={child} />
                          </td>
                          <td className="px-4 py-2">
                            <ActionBadge action={child.action} />
                          </td>
                          <td className="px-4 py-2 pl-10">
                            <EntityLabel event={child} />
                          </td>
                        </tr>
                      ))}
                  </Fragment>
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
            disabled={loading || exporting}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
