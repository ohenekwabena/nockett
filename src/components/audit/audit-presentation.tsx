"use client";

import { useState } from "react";
import type { AuditEvent } from "@/lib/audit-service";
import { humanizeLabel } from "@/lib/audit-filters";
import { MIcon } from "@/components/nk/ui";

/**
 * Shared presentational atoms for an Audit Event (Nockett design language).
 * Used by both the main log feed (audit-log-view) and the entity drill-down
 * trail (entity-trail-dialog), so the action/actor/diff styling stays identical
 * across the two surfaces (AUDIT-4). Pure and prop-driven.
 */

export const ACTION_UI: Record<string, { label: string; cls: string; icon: string }> = {
  insert: { label: "Insert", cls: "act-ins", icon: "add_circle" },
  update: { label: "Update", cls: "act-upd", icon: "edit" },
  delete: { label: "Delete", cls: "act-del", icon: "delete" },
  login: { label: "Login", cls: "act-login", icon: "login" },
};

export function actionUi(action: string | null) {
  return ACTION_UI[(action || "").toLowerCase()] || { label: action || "—", cls: "", icon: "help" };
}

/** Friendly entity label ("tickets" → "Ticket"). */
export function entityLabel(entityType: string | null): string {
  if (!entityType) return "—";
  const singular = entityType.endsWith("s") ? entityType.slice(0, -1) : entityType;
  return humanizeLabel(singular);
}

/** Render an ISO instant in the Admin's locale, 24-hour; falls back to the raw string. */
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

/** A pill coloring the action (insert/update/delete). */
export function ActionBadge({ action }: { action: string | null }) {
  const ui = actionUi(action);
  return (
    <span className={"act-badge " + ui.cls}>
      <MIcon name={ui.icon} size={12} fill={1} /> {ui.label}
    </span>
  );
}

/** The acting User's display name; "System" for trigger/seed writes with no actor. */
export function actorName(event: AuditEvent): string {
  return event.actor_name || event.actor_email || "System";
}

export function ActorCell({ event }: { event: AuditEvent }) {
  const primary = actorName(event);
  const secondary = event.actor_name && event.actor_email ? event.actor_email : null;
  return (
    <>
      <span style={{ fontWeight: 600 }}>{primary}</span>
      {secondary && <span className="dim"> · {secondary}</span>}
    </>
  );
}

/* ---------- change payload rendering ---------- */

export interface ChangeEntry {
  field: string;
  old?: unknown;
  new?: unknown;
}

/**
 * Flatten an Audit Event's captured `changes` into per-field entries. An update
 * stores {col: {old, new}}; an insert/delete stores the whole row {col: value}
 * (mapped to new/old respectively so the rendering can read one shape).
 */
export function changeEntries(event: AuditEvent): ChangeEntry[] {
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

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * A one-line human summary of the change ("created Ticket …", "Status OPEN →
 * CLOSED"). The trigger captures raw rows, so this picks the most recognisable
 * captured field to headline with.
 */
export function eventSummary(event: AuditEvent): string {
  const entries = changeEntries(event);
  const label = entityLabel(event.entity_type).toLowerCase();
  const pick = (...names: string[]) => {
    for (const name of names) {
      const entry = entries.find((item) => item.field === name);
      const value = entry && (entry.new ?? entry.old);
      if (value != null && value !== "") return String(value);
    }
    return null;
  };

  // A sign-in (migration 022) captures no entity, only the session context; read
  // its ip out of the payload for a one-line "signed in from …".
  if (event.action === "login") {
    const ip = pick("ip");
    return ip ? `signed in from ${ip}` : "signed in";
  }

  if (event.action === "update") {
    const parts = entries
      .slice(0, 2)
      .map((entry) => `${humanizeLabel(entry.field)} ${formatValue(entry.old)} → ${formatValue(entry.new)}`);
    const suffix = entries.length > 2 ? ` (+${entries.length - 2} more)` : "";
    return parts.length > 0 ? `updated ${label}: ${parts.join(", ")}${suffix}` : `updated ${label}`;
  }

  const ref = pick("ticket_id", "title", "name", "email", "filename", "content");
  const verb = event.action === "delete" ? "deleted" : "created";
  return ref ? `${verb} ${label} “${ref}”` : `${verb} ${label}`;
}

/**
 * The captured-field diff block (design DiffTable). Inserts/deletes capture the
 * whole row, so long payloads are truncated behind a "show all" disclosure.
 */
export function DiffTable({ event, maxRows = 8 }: { event: AuditEvent; maxRows?: number }) {
  const [showAll, setShowAll] = useState(false);
  const entries = changeEntries(event);
  if (entries.length === 0) return null;
  const shown = showAll ? entries : entries.slice(0, maxRows);
  return (
    <div className="diff">
      {shown.map((entry) => (
        <div key={entry.field} className="diff-row">
          <span className="diff-k">{entry.field}</span>
          <span className={"diff-v" + (entry.old == null ? " none" : " old")}>{formatValue(entry.old)}</span>
          <MIcon name="arrow_right_alt" size={15} className="dim" />
          <span className={"diff-v" + (entry.new == null ? " none" : " new")}>{formatValue(entry.new)}</span>
        </div>
      ))}
      {entries.length > maxRows && (
        <button type="button" className="link-btn" style={{ fontSize: 11.5 }} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer fields" : `Show all ${entries.length} fields`}
        </button>
      )}
    </div>
  );
}
