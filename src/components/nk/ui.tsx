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
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
  if (!open) return null;
  return (
    <div ref={ref} className="popover" style={{ [align]: 0, width } as CSSProperties}>
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
  return (
    <select
      className="input"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const opt = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
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
