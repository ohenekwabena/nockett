"use client";

/**
 * The Audit Log filter bar (AUDIT-3, AUDIT-5), in the Nockett design language:
 * a free-text payload search plus date range and actor / entity / action
 * selects. Purely presentational — it owns no query state (the search box keeps
 * only an uncommitted draft); AuditLogView re-queries page one on every change.
 */

import { useEffect, useState } from "react";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit-service";
import {
  hasActiveFilters,
  humanizeLabel,
  type AuditActor,
  type AuditFilterState,
} from "@/lib/audit-filters";
import { MIcon, Select } from "@/components/nk/ui";

interface AuditFilterBarProps {
  filters: AuditFilterState;
  actors: AuditActor[];
  /** Disabled while a query is in flight, so controls can't race the read seam. */
  disabled?: boolean;
  onChange: (next: AuditFilterState) => void;
  onReset: () => void;
}

export function AuditFilterBar({ filters, actors, disabled, onChange, onReset }: AuditFilterBarProps) {
  const set = (patch: Partial<AuditFilterState>) => onChange({ ...filters, ...patch });

  // The text box holds a local draft and commits on Enter, so typing doesn't
  // thrash the read seam. The draft re-syncs when Reset clears the filters.
  const [draft, setDraft] = useState(filters.search);
  useEffect(() => setDraft(filters.search), [filters.search]);

  return (
    <div className="audit-filters">
      <div className="search-box" style={{ flex: 1, minWidth: 160 }}>
        <MIcon name="search" size={15} />
        <input
          placeholder="Search change payloads… (Enter)"
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") set({ search: draft.trim() });
          }}
        />
      </div>
      <input
        type="date"
        className="input"
        style={{ width: "auto" }}
        value={filters.from}
        max={filters.to || undefined}
        disabled={disabled}
        onChange={(event) => set({ from: event.target.value })}
        aria-label="From date"
      />
      <input
        type="date"
        className="input"
        style={{ width: "auto" }}
        value={filters.to}
        min={filters.from || undefined}
        disabled={disabled}
        onChange={(event) => set({ to: event.target.value })}
        aria-label="To date"
      />
      <Select
        value={filters.actorId}
        disabled={disabled}
        onChange={(actorId) => set({ actorId })}
        placeholder="All actors"
        options={actors.map((actor) => ({
          value: actor.id,
          label: actor.name || actor.email || actor.id,
        }))}
      />
      <Select
        value={filters.entityType}
        disabled={disabled}
        onChange={(entityType) => set({ entityType })}
        placeholder="All entities"
        options={AUDIT_ENTITY_TYPES.map((type) => ({ value: type, label: humanizeLabel(type) }))}
      />
      <Select
        value={filters.action}
        disabled={disabled}
        onChange={(action) => set({ action })}
        placeholder="All actions"
        options={AUDIT_ACTIONS.map((action) => ({ value: action, label: humanizeLabel(action) }))}
      />
      {hasActiveFilters(filters) && (
        <button type="button" className="link-btn" onClick={onReset} disabled={disabled}>
          Clear
        </button>
      )}
    </div>
  );
}
