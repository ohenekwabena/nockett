"use client";

/**
 * The Admin-only Audit Log surface, in the Nockett design language (design
 * audit.jsx). Server-rendered with the first (newest) page; "Load more" walks
 * older Audit Events via the keyset read seam. Capture lands by DB trigger
 * (ADR-0004), so this view never writes — it only reads.
 *
 * A cascade burst (e.g. deleting a Ticket, whose comments/notes/attachments
 * cascade in the same transaction) shares one txid, so the feed is collapsed
 * into per-txid groups (AUDIT-2). The filter bar (AUDIT-3) narrows by payload
 * search, date range, actor, entity type, and action; the Ticket Number lookup
 * (AUDIT-4) resolves a typed Ticket#… to its uuid and opens its trail.
 */

import { useMemo, useRef, useState } from "react";
import { listEvents, type AuditCursor, type AuditEvent } from "@/lib/audit-service";
import { groupEventsByTxid, type AuditEventGroup } from "@/lib/audit-grouping";
import { ExportService } from "@/lib/export-service";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import {
  ActionBadge,
  DiffTable,
  actorName,
  entityLabel,
  eventSummary,
  formatTimestamp,
} from "@/components/audit/audit-presentation";
import { EntityTrailDialog, type EntityTrailTarget } from "@/components/audit/entity-trail-dialog";
import {
  EMPTY_AUDIT_FILTERS,
  hasActiveFilters,
  toServiceFilters,
  type AuditActor,
  type AuditFilterState,
} from "@/lib/audit-filters";
import { ticketService } from "@/services/ticket-service";
import { Avatar, Btn, Chip, EmptyState, MIcon } from "@/components/nk/ui";

interface AuditLogViewProps {
  initialEvents: AuditEvent[];
  initialCursor: AuditCursor | null;
  pageSize: number;
  /** Actors for the filter dropdown (all Users; reuses the app's users read). */
  actors: AuditActor[];
}

// Export pulls the whole filtered set into the client by walking the keyset
// pages; a wide page size keeps that to few round-trips (AUDIT-6 caveat).
const EXPORT_BATCH_SIZE = 1000;

function AuditRow({
  group,
  onTrail,
}: {
  group: AuditEventGroup;
  onTrail: (event: AuditEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const head = group.primary;
  return (
    <div className="audit-row">
      <button type="button" className="audit-main" onClick={() => setOpen(!open)}>
        <Avatar name={actorName(head)} size={26} />
        <span className="audit-body">
          <span className="audit-line">
            <strong>{actorName(head)}</strong> {eventSummary(head)}
            {group.related.length > 0 && <span className="chip chip-soft">+{group.related.length} cascaded</span>}
          </span>
          <span className="audit-meta">
            <ActionBadge action={head.action} />
            <span className="chip chip-soft">{entityLabel(head.entity_type)}</span>
            {head.entity_id && (
              <span
                className="link-btn mono"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onTrail(head);
                }}
                title="View this entity's trail"
              >
                {head.entity_id.slice(0, 8)}…
              </span>
            )}
            <span className="dim">{formatTimestamp(head.created_at)}</span>
          </span>
        </span>
        <MIcon name={open ? "expand_less" : "expand_more"} size={17} className="dim" />
      </button>
      {open && (
        <div className="audit-detail">
          {group.events.map((event) => (
            <div key={event.id} className="audit-sub">
              {group.events.length > 1 && (
                <div className="audit-subhead">
                  <ActionBadge action={event.action} />
                  <span className="dim">{entityLabel(event.entity_type)}</span> — {eventSummary(event)}
                </div>
              )}
              <DiffTable event={event} />
            </div>
          ))}
          <div className="dim" style={{ fontSize: 11.5 }}>
            Transaction {head.txid} · written by the database trigger, actor snapshotted at write time
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLogView({ initialEvents, initialCursor, pageSize, actors }: AuditLogViewProps) {
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents);
  const [cursor, setCursor] = useState<AuditCursor | null>(initialCursor);
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entity drill-down (AUDIT-4): the open trail target, plus the Ticket Number
  // lookup's own input/pending state (separate from the list's loading).
  const [trailTarget, setTrailTarget] = useState<EntityTrailTarget | null>(null);
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Monotonic id stamped on every fetch: a slower earlier response (e.g. the user
  // re-filters mid-load) is discarded so only the newest query wins the state.
  const requestRef = useRef(0);

  const groups = useMemo(() => groupEventsByTxid(events), [events]);
  const filtered = hasActiveFilters(filters);

  // Re-query the first (newest) page under a new filter set.
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
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Failed to filter Audit Events");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || loading) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      // Carry the active filters so older pages stay within the same slice.
      const result = await listEvents({ limit: pageSize, cursor, filters: toServiceFilters(filters) });
      if (requestRef.current !== requestId) return;
      setEvents((previous) => [...previous, ...result.events]);
      setCursor(result.nextCursor);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Failed to load more Audit Events");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  };

  const openEventTrail = (event: AuditEvent) => {
    if (!event.entity_type || !event.entity_id) return;
    setTrailTarget({ entityType: event.entity_type, entityId: event.entity_id });
  };

  // Resolve a typed Ticket Number to its uuid, then open that Ticket's trail.
  const lookupTicketTrail = async () => {
    const number = lookupNumber.trim();
    if (!number || lookupLoading) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const ticketId = await ticketService.getTicketIdByNumber(number);
      if (!ticketId) {
        setLookupError(`No Ticket found with number “${number}”.`);
        return;
      }
      setTrailTarget({ entityType: "tickets", entityId: ticketId, label: number });
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Ticket lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // Export the whole active-filter result set to .xlsx by re-walking the keyset
  // pages from the top, so the file is the complete filtered log.
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
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="verified_user" size={20} className="accent" fill={1} />
          <h1>Audit Log</h1>
          <Chip tone="blue">Admin only</Chip>
        </div>
        <div className="page-actions">
          <div className="search-box" style={{ width: 210 }}>
            <MIcon name="tag" size={15} />
            <input
              placeholder="Look up Ticket#…"
              value={lookupNumber}
              disabled={lookupLoading}
              onChange={(event) => {
                setLookupNumber(event.target.value);
                if (lookupError) setLookupError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") lookupTicketTrail();
              }}
            />
          </div>
          <Btn small icon="download" disabled={exporting || loading || events.length === 0} onClick={exportEvents}>
            {exporting ? "Exporting…" : "Export"}
          </Btn>
        </div>
      </div>

      {lookupError && (
        <div className="banner-err" style={{ marginBottom: 12 }}>
          <MIcon name="error" size={14} fill={1} /> {lookupError}
        </div>
      )}

      <AuditFilterBar
        filters={filters}
        actors={actors}
        disabled={loading || exporting}
        onChange={applyFilters}
        onReset={() => applyFilters(EMPTY_AUDIT_FILTERS)}
      />

      {events.length === 0 ? (
        filtered ? (
          <EmptyState
            icon="search_off"
            title="No matching events"
            body="Adjust the filters or search to widen the window."
          />
        ) : (
          <EmptyState
            icon="verified_user"
            title="No Audit Events yet"
            body="Changes across the app will appear here as they happen."
          />
        )
      ) : (
        <div className="audit-feed">
          {groups.map((group) => (
            <AuditRow key={group.key} group={group} onTrail={openEventTrail} />
          ))}
        </div>
      )}

      {error && (
        <div className="banner-err" style={{ marginTop: 12 }}>
          <MIcon name="error" size={14} fill={1} /> {error}
        </div>
      )}

      {cursor && (
        <div className="row-center">
          <Btn small icon="expand_more" disabled={loading || exporting} onClick={loadMore}>
            {loading ? "Loading…" : "Load more"}
          </Btn>
        </div>
      )}

      <EntityTrailDialog target={trailTarget} onClose={() => setTrailTarget(null)} />
    </div>
  );
}
