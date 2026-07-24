"use client";

/**
 * Nockett design-system primitives, ported from the Claude design project
 * (app/ui.jsx). Pure presentation: every component renders the design's
 * class names from globals.css and holds no data-access logic.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/* ---------- Material Symbol ---------- */
export function MIcon({
  name,
  size = 18,
  fill = 0,
  weight = 400,
  style,
  className,
}: {
  name: string;
  size?: number;
  fill?: 0 | 1;
  weight?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={"msym " + (className || "")}
      aria-hidden="true"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

/* ---------- Avatars (initials on a deterministic pastel tint) ---------- */
const AVATAR_TINTS: Array<[string, string, string, string]> = [
  // [light bg, light fg, dark bg, dark fg]
  ["#e8ecfb", "#3651a8", "#2b3557", "#a9bdf5"],
  ["#fbe9e0", "#a05224", "#4a3327", "#f0b795"],
  ["#e3f2e6", "#2c7a42", "#27402d", "#8fd4a2"],
  ["#f3e8fb", "#7a3fa8", "#3d2b4f", "#cfa9f0"],
  ["#fdf1d7", "#93690d", "#4a3d1e", "#eccb7c"],
  ["#e0f0f6", "#20708c", "#233c46", "#8dcbe2"],
  ["#fbe4ea", "#a83a5d", "#4a2733", "#f0a2ba"],
  ["#e9f6e0", "#537a24", "#33401f", "#b3d98a"],
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function initialsOf(name?: string | null): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase() || first.toUpperCase();
}

export function Avatar({
  name,
  size = 26,
  title,
}: {
  name?: string | null;
  size?: number;
  title?: string;
}) {
  const label = (name || "").trim() || "Unknown";
  const [bg, fg, dbg, dfg] = AVATAR_TINTS[hashString(label) % AVATAR_TINTS.length];
  return (
    <span
      className="avatar nk-avatar"
      title={title || label}
      style={
        {
          width: size,
          height: size,
          fontSize: Math.max(9, Math.round(size * 0.4)),
          borderRadius: Math.round(size * 0.3),
          "--av-bg": bg,
          "--av-fg": fg,
          "--av-dbg": dbg,
          "--av-dfg": dfg,
        } as CSSProperties
      }
    >
      {initialsOf(label)}
    </span>
  );
}

export function AvatarStack({
  names,
  size = 26,
  max = 3,
}: {
  names: Array<string | null | undefined>;
  size?: number;
  max?: number;
}) {
  const real = names.filter((n): n is string => Boolean(n && n.trim()));
  if (real.length === 0) {
    return (
      <span className="avatar more" style={{ width: size, height: size, fontSize: 11 }} title="Unassigned">
        —
      </span>
    );
  }
  const shown = real.slice(0, max);
  return (
    <span className="avatar-stack">
      {shown.map((name, index) => (
        <Avatar key={name + index} name={name} size={size} />
      ))}
      {real.length > max && (
        <span className="avatar more" style={{ width: size, height: size, fontSize: 11 }}>
          +{real.length - max}
        </span>
      )}
    </span>
  );
}

/* ---------- Status / priority ---------- */
export const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;

const STATUS_UI: Record<string, { icon: string; cls: string; label: string }> = {
  OPEN: { icon: "radio_button_unchecked", cls: "st-open", label: "Open" },
  IN_PROGRESS: { icon: "clock_loader_40", cls: "st-progress", label: "In Progress" },
  CLOSED: { icon: "check_circle", cls: "st-closed", label: "Closed" },
};

export function statusUi(status?: string | null) {
  return STATUS_UI[(status || "OPEN").toUpperCase()] || STATUS_UI.OPEN;
}

export function StatusBadge({ status }: { status?: string | null }) {
  const ui = statusUi(status);
  return (
    <span className={"status-badge " + ui.cls}>
      <MIcon name={ui.icon} size={15} fill={ui.cls === "st-closed" ? 1 : 0} weight={500} />
      {ui.label}
    </span>
  );
}

const PRIO_COLOR: Record<string, string> = {
  URGENT: "#dc2626",
  CRITICAL: "#dc2626",
  HIGHEST: "#dc2626",
  MAJOR: "#ea580c",
  HIGH: "#ea580c",
  MEDIUM: "#2563eb",
  LOW: "#16a34a",
  MINOR: "#16a34a",
};
const PRIO_LEVEL: Record<string, number> = {
  URGENT: 3,
  CRITICAL: 3,
  HIGHEST: 3,
  MAJOR: 3,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  MINOR: 1,
};

export function priorityRank(priority?: string | null): number {
  const key = (priority || "").toUpperCase();
  return { URGENT: 6, CRITICAL: 5, HIGHEST: 5, MAJOR: 4, HIGH: 4, MEDIUM: 3, LOW: 2, MINOR: 1 }[key] || 0;
}

export function PriorityCell({ priority, plain }: { priority?: string | null; plain?: boolean }) {
  const key = (priority || "").toUpperCase();
  const color = PRIO_COLOR[key] || "#71717a";
  const level = PRIO_LEVEL[key] || 1;
  const label = priority
    ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase().replace(/_/g, " ")
    : "—";
  return (
    <span className="prio-cell">
      <span className="prio-bars" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            style={{ height: 3 + bar * 3, background: bar <= level ? color : "var(--hair2)" }}
          ></span>
        ))}
      </span>
      {!plain && <span>{label}</span>}
    </span>
  );
}

/* ---------- Chip ---------- */
export function Chip({
  children,
  onRemove,
  tone,
  onClick,
  title,
}: {
  children: ReactNode;
  onRemove?: () => void;
  tone?: "blue" | "red" | "orange" | "green" | "soft";
  onClick?: () => void;
  title?: string;
}) {
  const cls = "chip" + (tone ? " chip-" + tone : "");
  const body = (
    <>
      {children}
      {onRemove && (
        <span
          className="chip-x"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <MIcon name="close" size={13} />
        </span>
      )}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} title={title}>
        {body}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {body}
    </span>
  );
}

/* ---------- Buttons ---------- */
export function Btn({
  children,
  kind = "ghost",
  icon,
  onClick,
  disabled,
  small,
  style,
  title,
  type = "button",
}: {
  children?: ReactNode;
  kind?: "ghost" | "primary" | "danger";
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  style?: CSSProperties;
  title?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={"btn btn-" + kind + (small ? " btn-sm" : "")}
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}
    >
      {icon && <MIcon name={icon} size={small ? 15 : 17} weight={500} />}
      {children}
    </button>
  );
}

export function IconBtn({
  icon,
  onClick,
  title,
  size = 16,
  className,
}: {
  icon: string;
  onClick?: (event: React.MouseEvent) => void;
  title?: string;
  size?: number;
  className?: string;
}) {
  return (
    <button type="button" className={"icon-btn " + (className || "")} onClick={onClick} title={title} aria-label={title}>
      <MIcon name={icon} size={size} />
    </button>
  );
}

/* ---------- Popover ---------- */
export function Popover({
  anchor,
  open,
  onClose,
  children,
  align = "left",
  width,
  minWidth,
  fixed,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
  /** "100%" resolves to the anchor's width in fixed mode. */
  minWidth?: number | string;
  /**
   * Position against the viewport via a portal instead of the nearest
   * positioned ancestor, so the menu escapes overflow clipping (scrolling
   * modals / side panels). Closes on outside scroll.
   */
  fixed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CSSProperties | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        (!anchor.current || !anchor.current.contains(target))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!open || !fixed) {
      setPos(null);
      return;
    }
    const el = anchor.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const style: CSSProperties = { position: "fixed", zIndex: 120 };
    if (align === "right") style.right = window.innerWidth - rect.right;
    else style.left = rect.left;
    // Flip upward when the space below can't fit a typical menu.
    if (spaceBelow < 260 && rect.top > spaceBelow) style.bottom = window.innerHeight - rect.top + 6;
    else style.top = rect.bottom + 6;
    style.minWidth = minWidth === "100%" ? rect.width : minWidth;
    setPos(style);
    const dismiss = (event: Event) => {
      if (ref.current && event.target instanceof Node && ref.current.contains(event.target)) return;
      onClose();
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixed]);
  if (!open) return null;
  if (fixed) {
    if (!pos) return null;
    return createPortal(
      <div ref={ref} className="popover" style={{ ...pos, width }}>
        {children}
      </div>,
      document.body
    );
  }
  return (
    <div ref={ref} className="popover" style={{ [align]: 0, width, minWidth } as CSSProperties}>
      {children}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="modal-veil"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal" style={{ width, maxWidth: "94vw" }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <IconBtn icon="close" size={18} onClick={onClose} title="Close" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  danger = true,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={400}
      footer={
        <div className="row-end">
          <Btn kind="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn kind={danger ? "danger" : "primary"} disabled={busy} onClick={onConfirm}>
            {busy ? "Working…" : confirmLabel}
          </Btn>
        </div>
      }
    >
      <p className="dim" style={{ margin: 0 }}>
        {body}
      </p>
    </Modal>
  );
}

/* ---------- Small bits ---------- */
export function SegTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; icon?: string; count?: number | null }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="seg-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={"seg-tab" + (value === tab.id ? " on" : "")}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <MIcon name={tab.icon} size={15} weight={500} />}
          {tab.label}
          {tab.count != null && <span className="seg-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-ic">
        <MIcon name={icon} size={26} />
      </div>
      <div className="empty-t">{title}</div>
      {body && <div className="empty-b">{body}</div>}
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="nk-loading">
      <span className="nk-spinner" aria-hidden="true"></span>
      {label}
    </div>
  );
}

export function Field({
  label,
  children,
  span,
}: {
  label: ReactNode;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <label className="field" style={span ? { gridColumn: "1 / -1" } : undefined}>
      <span className="field-l">{label}</span>
      {children}
    </label>
  );
}

/**
 * Popover-based selects (the ticket-panel dropdown pattern, shared app-wide).
 * `Select` is the form-field variant (input-styled trigger); `InlineSelect` is
 * the borderless inline variant used in property rows. Both render the same
 * `pop-item` menu inside a `Popover`.
 */
function PopItems({
  items,
  value,
  onSelect,
  render,
}: {
  items: Array<{ value: string; label: string }>;
  value: string;
  onSelect: (value: string) => void;
  render?: (value: string) => ReactNode;
}) {
  return (
    <>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={"pop-item" + (item.value === value ? " on" : "")}
          onClick={() => onSelect(item.value)}
        >
          {render ? render(item.value) : item.label}
          {item.value === value && <MIcon name="check" size={14} />}
        </button>
      ))}
    </>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const items = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
  // A placeholder is a selectable empty choice, matching the old
  // `<option value="">` behavior.
  if (placeholder) items.unshift({ value: "", label: placeholder });
  const current = items.find((item) => item.value === (value || ""));
  const showLabel = current ? current.label : value || placeholder || "";
  const showsPlaceholder = !value && !!placeholder;
  return (
    <span className="sel-wrap">
      <button
        ref={btn}
        type="button"
        className="input sel-btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
      >
        <span className={"sel-v" + (showsPlaceholder ? " dim" : "")}>{showLabel}</span>
        <MIcon name="expand_more" size={15} className="dim" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} minWidth="100%" fixed>
        <PopItems
          items={items}
          value={value || ""}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </Popover>
    </span>
  );
}

export function InlineSelect({
  value,
  options,
  onChange,
  render,
  placeholder = "—",
}: {
  value?: string | null;
  options: string[];
  onChange: (value: string) => void;
  render?: (value: string) => ReactNode;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <span style={{ position: "relative" }}>
      <button ref={btn} type="button" className="inline-sel-btn" onClick={() => setOpen(!open)}>
        {value ? (render ? render(value) : value) : <span className="dim">{placeholder}</span>}
        <MIcon name="expand_more" size={14} className="dim" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} width={200} fixed>
        <PopItems
          items={options.map((option) => ({ value: option, label: option }))}
          value={value || ""}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
          render={render}
        />
      </Popover>
    </span>
  );
}

/* ---------- Date field (calendar popover with native-input value semantics) ----------
 * A drop-in for `<input type="date">`, built from the same design-system pieces
 * as `Select` (the `.input.sel-btn` trigger + a `Popover`). It talks the exact
 * native contract — `value`/`onChange` are `YYYY-MM-DD` strings and `min`/`max`
 * are the same bounds — so callers swap it in without changing their state. */
const CAL_DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const CAL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a `YYYY-MM-DD` string into a *local* Date (no UTC-midnight day shift). */
function isoToDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Serialise a Date to the `YYYY-MM-DD` a native date input would emit. */
function dateToISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole-day ordering, ignoring time-of-day: -1 / 0 / 1. */
function compareDay(a: Date, b: Date): number {
  const av = a.getFullYear() * 10000 + a.getMonth() * 100 + a.getDate();
  const bv = b.getFullYear() * 10000 + b.getMonth() * 100 + b.getDate();
  return av === bv ? 0 : av < bv ? -1 : 1;
}

function clampDay(date: Date, min: Date | null, max: Date | null): Date {
  if (min && compareDay(date, min) < 0) return min;
  if (max && compareDay(date, max) > 0) return max;
  return date;
}

export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = "dd/mm/yyyy",
  disabled,
  ariaLabel,
  clearable = true,
}: {
  /** Bound value as `YYYY-MM-DD`, or empty — exactly like a native date input. */
  value?: string;
  onChange: (value: string) => void;
  /** `YYYY-MM-DD` bounds, matching a native input's `min` / `max`. */
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const btn = useRef<HTMLButtonElement>(null);
  const focusedRef = useRef<HTMLButtonElement>(null);

  const selected = isoToDate(value);
  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);

  // `cursor` = first day of the month on screen; `focus` = keyboard-highlighted day.
  const [cursor, setCursor] = useState<Date>(() => selected ?? new Date());
  const [focus, setFocus] = useState<Date>(() => clampDay(selected ?? new Date(), minDate, maxDate));

  // Re-seat the calendar each time it opens (and follow external value changes).
  useEffect(() => {
    if (!open) return;
    const seed = clampDay(isoToDate(value) ?? new Date(), isoToDate(min), isoToDate(max));
    setCursor(new Date(seed.getFullYear(), seed.getMonth(), 1));
    setFocus(seed);
    setView("days");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep DOM focus on the highlighted day so keyboard nav reads like the native picker.
  useEffect(() => {
    if (open && view === "days") focusedRef.current?.focus();
  }, [open, view, focus]);

  const dayDisabled = (day: Date) =>
    Boolean((minDate && compareDay(day, minDate) < 0) || (maxDate && compareDay(day, maxDate) > 0));

  const commit = (day: Date) => {
    if (dayDisabled(day)) return;
    onChange(dateToISO(day));
    setOpen(false);
    btn.current?.focus();
  };

  const step = (delta: number) => {
    if (view === "days") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    else if (view === "months") setCursor(new Date(cursor.getFullYear() + delta, cursor.getMonth(), 1));
    else setCursor(new Date(cursor.getFullYear() + delta * 12, cursor.getMonth(), 1));
  };

  const onGridKey = (event: React.KeyboardEvent) => {
    let next: Date | null = null;
    const dow = (focus.getDay() + 6) % 7; // Monday-based weekday index
    switch (event.key) {
      case "ArrowLeft": next = addDays(focus, -1); break;
      case "ArrowRight": next = addDays(focus, 1); break;
      case "ArrowUp": next = addDays(focus, -7); break;
      case "ArrowDown": next = addDays(focus, 7); break;
      case "Home": next = addDays(focus, -dow); break;
      case "End": next = addDays(focus, 6 - dow); break;
      case "PageUp": next = new Date(focus.getFullYear(), focus.getMonth() - 1, focus.getDate()); break;
      case "PageDown": next = new Date(focus.getFullYear(), focus.getMonth() + 1, focus.getDate()); break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(focus);
        return;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        btn.current?.focus();
        return;
      default:
        return;
    }
    event.preventDefault();
    const clamped = clampDay(next, minDate, maxDate);
    setFocus(clamped);
    setCursor(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
  };

  const today = new Date();
  const display = selected ? selected.toLocaleDateString("en-GB") : "";

  // Prev/next only reach a wall in day view; out-of-range cells are disabled anyway.
  const prevDisabled =
    view === "days" && minDate != null &&
    compareDay(new Date(cursor.getFullYear(), cursor.getMonth(), 0), minDate) < 0;
  const nextDisabled =
    view === "days" && maxDate != null &&
    compareDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1), maxDate) > 0;

  const decadeStart = cursor.getFullYear() - (cursor.getFullYear() % 12);
  const title =
    view === "days"
      ? `${CAL_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === "months"
        ? String(cursor.getFullYear())
        : `${decadeStart} – ${decadeStart + 11}`;

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - lead);

  return (
    <span className="sel-wrap date-wrap">
      <button
        ref={btn}
        type="button"
        className="input sel-btn date-btn"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          else if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={"sel-v" + (selected ? "" : " dim")}>{selected ? display : placeholder}</span>
        <MIcon name="calendar_today" size={15} className="dim" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} fixed>
        <div className="cal" role="dialog" aria-label={ariaLabel || "Choose date"}>
          <div className="cal-head">
            <button
              type="button"
              className="cal-nav"
              onClick={() => step(-1)}
              disabled={prevDisabled}
              aria-label="Previous"
            >
              <MIcon name="chevron_left" size={18} />
            </button>
            <button
              type="button"
              className="cal-my"
              onClick={() =>
                setView(view === "days" ? "months" : view === "months" ? "years" : "days")
              }
            >
              {title}
              <MIcon name="expand_more" size={14} className="dim" />
            </button>
            <button
              type="button"
              className="cal-nav"
              onClick={() => step(1)}
              disabled={nextDisabled}
              aria-label="Next"
            >
              <MIcon name="chevron_right" size={18} />
            </button>
          </div>

          {view === "days" && (
            <>
              <div className="cal-grid cal-dow" aria-hidden="true">
                {CAL_DOW.map((label) => (
                  <span key={label} className="cal-dow-c">
                    {label}
                  </span>
                ))}
              </div>
              <div className="cal-grid" role="grid" onKeyDown={onGridKey}>
                {Array.from({ length: 42 }, (_, i) => {
                  const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
                  const outside = day.getMonth() !== cursor.getMonth();
                  const isSel = selected != null && compareDay(day, selected) === 0;
                  const isFocus = compareDay(day, focus) === 0;
                  const isToday = compareDay(day, today) === 0;
                  const off = dayDisabled(day);
                  return (
                    <button
                      key={i}
                      ref={isFocus ? focusedRef : undefined}
                      type="button"
                      role="gridcell"
                      tabIndex={isFocus ? 0 : -1}
                      aria-selected={isSel}
                      aria-current={isToday ? "date" : undefined}
                      disabled={off}
                      className={
                        "cal-day" +
                        (outside ? " out" : "") +
                        (isSel ? " on" : "") +
                        (isToday ? " today" : "") +
                        (isFocus && !isSel ? " focus" : "")
                      }
                      onClick={() => commit(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "months" && (
            <div className="cal-grid cal-months">
              {CAL_MONTHS.map((name, idx) => {
                const monthStart = new Date(cursor.getFullYear(), idx, 1);
                const monthEnd = new Date(cursor.getFullYear(), idx + 1, 0);
                const off = Boolean(
                  (minDate && compareDay(monthEnd, minDate) < 0) ||
                  (maxDate && compareDay(monthStart, maxDate) > 0)
                );
                const on =
                  selected != null &&
                  selected.getFullYear() === cursor.getFullYear() &&
                  selected.getMonth() === idx;
                return (
                  <button
                    key={name}
                    type="button"
                    className={"cal-cell" + (on ? " on" : "")}
                    disabled={off}
                    onClick={() => {
                      setCursor(new Date(cursor.getFullYear(), idx, 1));
                      setView("days");
                    }}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {view === "years" && (
            <div className="cal-grid cal-years">
              {Array.from({ length: 12 }, (_, i) => {
                const year = decadeStart + i;
                const yearStart = new Date(year, 0, 1);
                const yearEnd = new Date(year, 11, 31);
                const off = Boolean(
                  (minDate && compareDay(yearEnd, minDate) < 0) ||
                  (maxDate && compareDay(yearStart, maxDate) > 0)
                );
                const on = selected != null && selected.getFullYear() === year;
                return (
                  <button
                    key={year}
                    type="button"
                    className={"cal-cell" + (on ? " on" : "")}
                    disabled={off}
                    onClick={() => {
                      setCursor(new Date(year, cursor.getMonth(), 1));
                      setView("months");
                    }}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          <div className="cal-foot">
            <button
              type="button"
              className="cal-link"
              disabled={dayDisabled(today)}
              onClick={() => commit(today)}
            >
              Today
            </button>
            {clearable && selected && (
              <button
                type="button"
                className="cal-link"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  btn.current?.focus();
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Popover>
    </span>
  );
}

/* ---------- Formatting helpers ---------- */
export function fmtDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDT(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return (
    fmtDate(date) +
    ", " +
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function timeAgo(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (seconds < 3600) return Math.max(1, Math.round(seconds / 60)) + "m ago";
  if (seconds < 86400) return Math.round(seconds / 3600) + "h ago";
  return Math.round(seconds / 86400) + "d ago";
}

/** Display a Ticket Number ("Ticket#20260610004") in the compact "T-…" form. */
export function shortTicketNo(ticket: { ticket_id?: string | null; id?: string }): string {
  const number = ticket.ticket_id;
  if (number) return number.replace(/^Ticket#/i, "T-");
  return (ticket.id || "").slice(0, 8);
}

/* ---------- Shell context ---------- */
export interface TicketPanelApi {
  /** Optimistic update seam from the owning page (use-optimistic-tickets). */
  update?: (
    ticketId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optimistic: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server: any,
  ) => Promise<void>;
  /** Optimistic delete seam from the owning page. */
  remove?: (ticketId: string) => Promise<void>;
  /** Called after any write so the owning page can refresh non-optimistic data. */
  onChanged?: () => void;
}

export interface NkShellContextValue {
  search: string;
  setSearch: (value: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panelTicket: any | null;
  panelApi: TicketPanelApi | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openTicket: (ticket: any, api?: TicketPanelApi) => void;
  closeTicket: () => void;
  openCreate: () => void;
}

export const NkShellContext = createContext<NkShellContextValue | null>(null);

export function useNkShell(): NkShellContextValue {
  const context = useContext(NkShellContext);
  if (!context) throw new Error("useNkShell must be used within the AppShell");
  return context;
}

/* ---------- misc hooks ---------- */
/** localStorage-persisted state (client only; falls back to the default on SSR). */
export function usePersistentState<T extends string>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored != null) setValue(stored as T);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (next: T) => {
    setValue(next);
    window.localStorage.setItem(key, next);
  };
  return [value, set];
}
