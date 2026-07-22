"use client";

/**
 * The Audit entity drill-down (AUDIT-4), in the design's TrailDialog form: the
 * complete chronological trail for one entity in a modal, oldest-first. Opened
 * from a feed row or the Ticket Number lookup. A superseding open discards an
 * in-flight response so a slow earlier fetch can't overwrite a newer one.
 */

import { useEffect, useRef, useState } from "react";
import { getEventsForEntity, type AuditEvent } from "@/lib/audit-service";
import { humanizeLabel } from "@/lib/audit-filters";
import { Loading, Modal } from "@/components/nk/ui";
import { DiffTable, actionUi, actorName, eventSummary, formatTimestamp } from "./audit-presentation";

/** What the trail dialog is currently showing; null means closed. */
export interface EntityTrailTarget {
  /** Audited table name (audit_log.entity_type), e.g. "tickets". */
  entityType: string;
  /** The entity uuid as stored in audit_log.entity_id. */
  entityId: string;
  /** Friendly heading label (e.g. the Ticket Number the Admin looked up); defaults to the id. */
  label?: string;
}

interface EntityTrailDialogProps {
  target: EntityTrailTarget | null;
  onClose: () => void;
}

export function EntityTrailDialog({ target, onClose }: EntityTrailDialogProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!target) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    setEvents([]);
    getEventsForEntity({ entityType: target.entityType, entityId: target.entityId })
      .then((result) => {
        if (requestRef.current === requestId) setEvents(result);
      })
      .catch((err) => {
        if (requestRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Failed to load the entity trail");
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoading(false);
      });
  }, [target]);

  if (!target) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Entity trail"
      subtitle={
        <>
          {humanizeLabel(target.entityType)} · <span className="mono">{target.label ?? target.entityId}</span>
          {!loading && !error && events.length > 0 && (
            <>
              {" "}
              · {events.length} event{events.length === 1 ? "" : "s"}
            </>
          )}
        </>
      }
      width={560}
    >
      {loading && <Loading label="Loading trail…" />}
      {error && (
        <p className="dim" style={{ textAlign: "center", padding: "24px 0" }}>
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="trail">
          {events.map((event) => (
            <div key={event.id} className="trail-item">
              <span className={"trail-dot " + actionUi(event.action).cls}></span>
              <div className="trail-body">
                <div className="audit-line" style={{ fontSize: 13 }}>
                  <strong>{actorName(event)}</strong> {eventSummary(event)}
                  <span className="dim" style={{ marginLeft: 6 }}>
                    {formatTimestamp(event.created_at)}
                  </span>
                </div>
                <DiffTable event={event} />
              </div>
            </div>
          ))}
          {events.length === 0 && <div className="dim">No events recorded for this reference.</div>}
        </div>
      )}
    </Modal>
  );
}
