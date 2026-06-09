"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit-service";
import {
  hasActiveFilters,
  humanizeLabel,
  type AuditActor,
  type AuditFilterState,
} from "@/lib/audit-filters";

// Radix <SelectItem> forbids an empty-string value (it reserves "" for clearing),
// so the "Any …" option carries this sentinel and we translate it back to "" —
// our own "no constraint" marker — on change.
const ANY = "__any__";

interface AuditFilterBarProps {
  filters: AuditFilterState;
  actors: AuditActor[];
  /** Disabled while a query is in flight, so controls can't race the read seam. */
  disabled?: boolean;
  onChange: (next: AuditFilterState) => void;
  onReset: () => void;
}

/**
 * The Audit Log filter bar (AUDIT-3): a date range plus actor / entity-type /
 * action selects, driving the read seam's filters. Purely presentational — it
 * owns no query state; {@link AuditLogView} re-queries page one whenever this
 * reports a change, so the active filters govern results and pagination alike.
 */
export function AuditFilterBar({ filters, actors, disabled, onChange, onReset }: AuditFilterBarProps) {
  const set = (patch: Partial<AuditFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <Field label="From">
        <input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          disabled={disabled}
          onChange={(event) => set({ from: event.target.value })}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="To">
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          disabled={disabled}
          onChange={(event) => set({ to: event.target.value })}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Actor">
        <FilterSelect
          value={filters.actorId}
          placeholder="Any actor"
          disabled={disabled}
          onValueChange={(value) => set({ actorId: value })}
          options={actors.map((actor) => ({
            value: actor.id,
            label: actor.name || actor.email || actor.id,
          }))}
        />
      </Field>

      <Field label="Entity">
        <FilterSelect
          value={filters.entityType}
          placeholder="Any entity"
          disabled={disabled}
          onValueChange={(value) => set({ entityType: value })}
          options={AUDIT_ENTITY_TYPES.map((type) => ({ value: type, label: humanizeLabel(type) }))}
        />
      </Field>

      <Field label="Action">
        <FilterSelect
          value={filters.action}
          placeholder="Any action"
          disabled={disabled}
          onValueChange={(value) => set({ action: value })}
          options={AUDIT_ACTIONS.map((action) => ({ value: action, label: humanizeLabel(action) }))}
        />
      </Field>

      <button
        type="button"
        onClick={onReset}
        disabled={disabled || !hasActiveFilters(filters)}
        className="h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

const INPUT_CLASS =
  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
  "focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  );
}

/**
 * A Radix select over a "" = any string filter. The empty value renders the
 * placeholder via the {@link ANY} sentinel (Radix won't accept "" as an item
 * value) and reports back "" when chosen.
 */
function FilterSelect({
  value,
  placeholder,
  options,
  disabled,
  onValueChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || ANY}
      disabled={disabled}
      onValueChange={(next) => onValueChange(next === ANY ? "" : next)}
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
