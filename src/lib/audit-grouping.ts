import type { AuditEvent } from "@/lib/audit-service";

/**
 * Audit Log presentation helper (AUDIT-2). Pure, React-free, and unit-tested in
 * isolation: it collapses a cascade burst into one expandable row without the
 * read seam (audit-service) or the view needing to know how grouping works.
 */

/** A run of consecutive Audit Events that share one transaction id (txid). */
export interface AuditEventGroup {
  /** Stable React key / toggle id for this group — the primary event's id. */
  key: number;
  /** The transaction id every member shares. */
  txid: number;
  /** Members in feed order (newest-first, as delivered by the read seam). */
  events: AuditEvent[];
  /** The headline event: a cascade's parent, or the lone event of a 1-row group. */
  primary: AuditEvent;
  /** Members other than the primary, in feed order — the "related rows". */
  related: AuditEvent[];
}

/**
 * Collapse a newest-first Audit Event feed into groups, one per run of
 * consecutive events sharing a txid. A cascade delete (e.g. deleting a Ticket,
 * whose comments/notes/attachments cascade in the same transaction) writes its
 * whole burst under one txid (ADR-0004), so it becomes a single expandable
 * group; every ordinary single-row change stays a one-event group.
 *
 * Grouping is by *consecutive* txid, never a global bucket: a transaction's
 * events are always contiguous in the (created_at desc, id desc) feed, and
 * staying positional means a group split across a pagination boundary renders as
 * two adjacent groups rather than one reaching back across the page.
 */
export function groupEventsByTxid(events: AuditEvent[]): AuditEventGroup[] {
  const groups: AuditEventGroup[] = [];
  let run: AuditEvent[] = [];

  const flush = () => {
    if (run.length === 0) return;
    const members = run;
    const primary = pickPrimary(members);
    groups.push({
      key: primary.id,
      txid: primary.txid,
      events: members,
      primary,
      related: members.filter((event) => event !== primary),
    });
    run = [];
  };

  for (const event of events) {
    if (run.length > 0 && run[0].txid !== event.txid) flush();
    run.push(event);
  }
  flush();

  return groups;
}

/**
 * The group's headline event. In a cascade the child rows carry the parent's id
 * as a foreign key inside their captured `changes`, so the parent is the event
 * whose entity_id is referenced by the most siblings. With no references — the
 * ordinary single-event group, or rows that merely happened to share a txid — we
 * fall back to the first event in feed order.
 */
function pickPrimary(events: AuditEvent[]): AuditEvent {
  if (events.length === 1) return events[0];

  let best = events[0];
  let bestScore = -1;
  for (const candidate of events) {
    const score = referenceCount(candidate, events);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/** How many sibling events carry `candidate.entity_id` as a value in their captured row. */
function referenceCount(candidate: AuditEvent, events: AuditEvent[]): number {
  const id = candidate.entity_id;
  if (id == null) return 0;

  let count = 0;
  for (const other of events) {
    if (other !== candidate && changesReference(other.changes, id)) count++;
  }
  return count;
}

/** True if `id` appears as a scalar value in a captured-row `changes` payload. */
function changesReference(changes: AuditEvent["changes"], id: string): boolean {
  if (changes == null || typeof changes !== "object" || Array.isArray(changes)) return false;
  return Object.values(changes).some((value) => String(value) === id);
}
