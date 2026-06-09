"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEventsForEntity, type AuditEvent } from "@/lib/audit-service";
import { humanizeLabel } from "@/lib/audit-filters";
import { ActionBadge, ActorCell, formatTimestamp } from "@/components/audit/audit-presentation";

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

/**
 * The Audit entity drill-down (AUDIT-4): the complete chronological trail for one
 * entity, in a modal. Opened either from a row's "trail" affordance or from the
 * Ticket Number lookup. Fetches through {@link getEventsForEntity} (the
 * (entity_type, entity_id) index), oldest-first, whenever the target changes; a
 * superseding open discards an in-flight response so a slow earlier fetch can't
 * overwrite a newer one.
 */
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

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Entity trail</DialogTitle>
          <DialogDescription>
            {target && (
              <>
                {humanizeLabel(target.entityType)} ·{" "}
                <span className="font-mono">{target.label ?? target.entityId}</span>
                {!loading && !error && events.length > 0 && (
                  <> · {events.length} event{events.length === 1 ? "" : "s"}</>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto -mr-2 pr-2">
          {loading && (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading trail…</p>
          )}
          {error && (
            <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {!loading && !error && events.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No Audit Events recorded for this entity.
            </p>
          )}
          {!loading && !error && events.length > 0 && (
            <ol className="space-y-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatTimestamp(event.created_at)}
                    </span>
                    <ActionBadge action={event.action} />
                    <span className="text-sm">
                      <ActorCell event={event} />
                    </span>
                  </div>
                  <ChangeDetails event={event} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChangeEntry {
  field: string;
  old?: unknown;
  new?: unknown;
}

/**
 * Flatten an Audit Event's captured `changes` into per-field entries. An update
 * stores {col: {old, new}}; an insert/delete stores the whole row {col: value}
 * (mapped to new/old respectively so the rendering can read one shape).
 */
function changeEntries(event: AuditEvent): ChangeEntry[] {
  const changes = event.changes;
  if (changes == null || typeof changes !== "object" || Array.isArray(changes)) return [];
  const fields = changes as Record<string, unknown>;

  if (event.action === "update") {
    return Object.entries(fields).map(([field, value]) => {
      const pair = (value ?? {}) as { old?: unknown; new?: unknown };
      return { field, old: pair.old, new: pair.new };
    });
  }
  if (event.action === "delete") {
    return Object.entries(fields).map(([field, value]) => ({ field, old: value }));
  }
  return Object.entries(fields).map(([field, value]) => ({ field, new: value }));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * The per-event change body. Updates show their field diffs inline (usually a
 * line or two); inserts/deletes carry the whole row, so they tuck it behind a
 * collapsed disclosure to keep the timeline scannable.
 */
function ChangeDetails({ event }: { event: AuditEvent }) {
  const entries = changeEntries(event);
  if (entries.length === 0) return null;

  if (event.action === "update") {
    return (
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.field} className="text-xs">
            <span className="font-mono text-gray-700 dark:text-gray-300">{entry.field}</span>{" "}
            <span className="text-gray-400 line-through">{formatValue(entry.old)}</span>{" "}
            <span aria-hidden>→</span>{" "}
            <span className="text-gray-900 dark:text-gray-100">{formatValue(entry.new)}</span>
          </li>
        ))}
      </ul>
    );
  }

  const verb = event.action === "delete" ? "Removed row" : "Created row";
  return (
    <details className="mt-2">
      <summary className="cursor-pointer select-none text-xs text-gray-500 dark:text-gray-400">
        {verb} · {entries.length} field{entries.length === 1 ? "" : "s"}
      </summary>
      <ul className="mt-1 space-y-1">
        {entries.map((entry) => (
          <li key={entry.field} className="text-xs">
            <span className="font-mono text-gray-700 dark:text-gray-300">{entry.field}</span>:{" "}
            <span className="text-gray-900 dark:text-gray-100">
              {formatValue(event.action === "delete" ? entry.old : entry.new)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
