"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  applyShiftOverrides,
  dayNightImbalanceLimit,
  defaultRotaSeed,
  generateMonthSchedule,
  getScheduleStats,
  monthName,
  overrideKey,
  PERSONNEL,
  SHIFT_HOURS,
  type MonthSchedule,
  type PersonScheduleStats,
  type ShiftValue,
} from "@/lib/schedule-service";
import { exportRotaToExcel } from "@/lib/schedule-export";
import { exportRotaToImage, exportRotaToPdf } from "@/lib/schedule-image-export";
import {
  deleteSchedule,
  listSchedules,
  saveSchedule,
  type SavedSchedule,
} from "@/lib/schedule-history-service";
import { useAuth } from "@/context/auth-context";
import {
  Avatar,
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  fmtDate,
  IconBtn,
  MIcon,
  Modal,
  Popover,
} from "@/components/nk/ui";

const WD = ["M", "T", "W", "T", "F", "S", "S"];

function buildConstraints(capHours: number, imbalanceLimit: number): Array<{
  icon: string;
  label: string;
  test: (stats: PersonScheduleStats) => boolean;
}> {
  return [
    { icon: "bedtime", label: "Max 2 consecutive night shifts", test: (s) => s.maxConsecutiveNights <= 2 },
    { icon: "sunny", label: "Max 3 consecutive day shifts", test: (s) => s.maxConsecutiveDayShifts <= 3 },
    { icon: "block", label: "No day shift straight after a night", test: (s) => s.nightToDayViolations === 0 },
    { icon: "date_range", label: "Max 4 working days per week", test: (s) => s.maxWeeklyDays <= 4 },
    { icon: "timer", label: `Max ${capHours} hours this rota`, test: (s) => s.totalHours <= capHours },
    {
      icon: "balance",
      label: `Balanced day / night distribution (±${imbalanceLimit})`,
      test: (s) => Math.abs(s.totalDayShifts - s.totalNightShifts) <= imbalanceLimit,
    },
  ];
}

/** person|date → shift for every assigned slot; absent key = off. */
function toCellMap(days: MonthSchedule["days"]): Map<string, ShiftValue> {
  const cells = new Map<string, ShiftValue>();
  for (const day of days) {
    day.dayShift.forEach((person) => cells.set(overrideKey(person, day.date), "D"));
    day.nightShift.forEach((person) => cells.set(overrideKey(person, day.date), "N"));
  }
  return cells;
}

function ShiftChip({ value }: { value: ShiftValue }) {
  if (value === "D") return <span className="cell-d">D</span>;
  if (value === "N") return <span className="cell-n">N</span>;
  return <span className="cell-o"></span>;
}

export default function SchedulesPage() {
  const { user, isAdmin } = useAuth();
  const today = new Date();
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [seed, setSeed] = useState(() => defaultRotaSeed(today.getFullYear(), today.getMonth() + 1));
  const [overrides, setOverrides] = useState<Record<string, ShiftValue>>({});
  const [downloadOpen, setDownloadOpen] = useState(false);
  // Regenerating, changing month, or loading a saved rota all throw away the
  // current view (and any manual edits), so each routes through a confirmation
  // that also offers to save the current rota to history first.
  const [confirmAction, setConfirmAction] = useState<
    { kind: "regenerate" } | { kind: "month"; delta: number } | { kind: "load"; schedule: SavedSchedule } | null
  >(null);
  const [history, setHistory] = useState<SavedSchedule[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedSchedule | null>(null);
  const downloadBtn = useRef<HTMLButtonElement>(null);
  const historyBtn = useRef<HTMLButtonElement>(null);

  const base = useMemo(() => {
    try {
      return { schedule: generateMonthSchedule(period.year, period.month, seed), error: null as string | null };
    } catch (error) {
      return { schedule: null, error: error instanceof Error ? error.message : "Failed to generate a rota" };
    }
  }, [period, seed]);

  const rota = useMemo(() => {
    if (!base.schedule) return null;
    const days = applyShiftOverrides(base.schedule.days, overrides);
    return {
      days,
      cells: toCellMap(days),
      baseCells: toCellMap(base.schedule.days),
      stats: getScheduleStats(days, base.schedule.weeks.length),
      columns: base.schedule.weeks.flatMap((week) => week.dates),
    };
  }, [base, overrides]);

  const capHours = (base.schedule?.maxShifts ?? 0) * SHIFT_HOURS;
  const imbalanceLimit = dayNightImbalanceLimit(base.schedule?.scheduledDays ?? 0);
  const constraints = useMemo(() => buildConstraints(capHours, imbalanceLimit), [capHours, imbalanceLimit]);
  const editedCount = Object.keys(overrides).length;
  const editCountLabel = `${editedCount} manual edit${editedCount === 1 ? "" : "s"}`;
  const monthLabel = `${monthName(period.month)} ${period.year}`;

  function shiftPeriod(delta: number) {
    const next = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));
    const value = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    setPeriod(value);
    setSeed(defaultRotaSeed(value.year, value.month));
    setOverrides({});
  }

  /** "August 2026" for the month `delta` steps from the current period. */
  function periodLabel(delta: number): string {
    const next = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));
    return `${monthName(next.getUTCMonth() + 1)} ${next.getUTCFullYear()}`;
  }

  function regenerate() {
    setSeed(Math.floor(Math.random() * 1e9));
    setOverrides({});
    toast.success("Generated a new valid rota");
  }

  const scheduleTitle = (schedule: SavedSchedule) =>
    schedule.label || `${monthName(schedule.month)} ${schedule.year}`;

  function loadSchedule(schedule: SavedSchedule) {
    setPeriod({ year: schedule.year, month: schedule.month });
    setSeed(Number(schedule.seed));
    setOverrides((schedule.overrides as Record<string, ShiftValue>) ?? {});
    toast.success(`Loaded “${scheduleTitle(schedule)}”`);
  }

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await listSchedules());
    } catch (error) {
      console.error("Error loading schedule history:", error);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  /** Persist the current rota; returns whether it saved so callers can chain. */
  async function persistCurrent(label: string): Promise<boolean> {
    setSaving(true);
    try {
      await saveSchedule({
        year: period.year,
        month: period.month,
        seed,
        overrides,
        label,
        createdBy: user?.id ?? null,
      });
      await refreshHistory();
      toast.success("Saved to history");
      return true;
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Could not save the schedule");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveConfirm() {
    if (await persistCurrent(saveLabel)) setSaveOpen(false);
  }

  function requestLoad(schedule: SavedSchedule) {
    setHistoryOpen(false);
    // Loading over unsaved manual edits is destructive; otherwise just load.
    if (editedCount > 0) setConfirmAction({ kind: "load", schedule });
    else loadSchedule(schedule);
  }

  // `save` first persists the current rota (used by the modal's "Save & continue").
  async function runConfirmAction(save: boolean) {
    if (!confirmAction) return;
    if (save && !(await persistCurrent(monthLabel))) return;
    if (confirmAction.kind === "regenerate") regenerate();
    else if (confirmAction.kind === "month") shiftPeriod(confirmAction.delta);
    else loadSchedule(confirmAction.schedule);
    setConfirmAction(null);
  }

  async function handleDeleteSchedule() {
    if (!deleteTarget) return;
    try {
      await deleteSchedule(deleteTarget.id);
      await refreshHistory();
      toast.success("Removed from history");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Could not delete the schedule");
    } finally {
      setDeleteTarget(null);
    }
  }

  function cycleCell(person: string, date: string) {
    if (!rota) return;
    const key = overrideKey(person, date);
    const baseValue = rota.baseCells.get(key) ?? null;
    const current = key in overrides ? overrides[key] : baseValue;
    const next: ShiftValue = current === null ? "D" : current === "D" ? "N" : null;
    setOverrides((prev) => {
      const copy = { ...prev };
      if (next === baseValue) {
        delete copy[key];
      } else {
        copy[key] = next;
      }
      return copy;
    });
  }

  async function handleDownload(format: "xlsx" | "pdf" | "png") {
    if (!base.schedule || !rota) return;
    setDownloadOpen(false);
    const payload = {
      year: period.year,
      month: period.month,
      weeks: base.schedule.weeks,
      days: rota.days,
    };
    try {
      if (format === "xlsx") await exportRotaToExcel(payload);
      else if (format === "pdf") await exportRotaToPdf(payload);
      else await exportRotaToImage(payload);
      toast.success(`Downloaded ${monthLabel} rota`);
    } catch {
      toast.error("Could not build the rota file");
    }
  }

  if (base.error || !base.schedule || !rota) {
    return (
      <div className="page">
        <EmptyState
          icon="calendar_month"
          title="Could not generate a rota"
          body={base.error ?? "Failed to generate a rota"}
          action={
            <Btn small kind="primary" onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>
              Try again
            </Btn>
          }
        />
      </div>
    );
  }

  const monthPrefix = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const coverageOk = rota.days.every(
    (day) => day.dayShift.length === (day.weekdayIndex === 2 ? 3 : 2) && day.nightShift.length === 2,
  );

  // View-model for the "this replaces the current rota" confirmation, shared by
  // regenerate / month-switch / load-from-history.
  const confirmView = !confirmAction
    ? null
    : confirmAction.kind === "regenerate"
      ? {
          title: "Regenerate schedule?",
          body: `This builds a brand-new random rota for ${monthLabel}${
            editedCount > 0 ? ` and discards your ${editCountLabel}` : ""
          }.`,
          proceed: "Regenerate",
        }
      : confirmAction.kind === "month"
        ? {
            title: `Switch to ${periodLabel(confirmAction.delta)}?`,
            body: `The ${monthLabel} rota${
              editedCount > 0 ? ` and its ${editCountLabel}` : ""
            } will be replaced by a fresh ${periodLabel(confirmAction.delta)} rota.`,
            proceed: "Switch month",
          }
        : {
            title: `Load “${scheduleTitle(confirmAction.schedule)}”?`,
            body: `Loading this saved rota replaces the current ${monthLabel} view and discards your ${editCountLabel}.`,
            proceed: "Load rota",
          };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="calendar_month" size={20} className="accent" fill={1} />
          <h1>Shift schedule</h1>
        </div>
        <div className="page-actions">
          <span className="rota-month">
            <IconBtn
              icon="chevron_left"
              title="Previous month"
              onClick={() => setConfirmAction({ kind: "month", delta: -1 })}
            />
            <span className="rota-month-label">{monthLabel}</span>
            <IconBtn
              icon="chevron_right"
              title="Next month"
              onClick={() => setConfirmAction({ kind: "month", delta: 1 })}
            />
          </span>
          {editedCount > 0 && (
            <Btn
              small
              icon="undo"
              title="Discard manual edits and restore the generated rota"
              onClick={() => {
                setOverrides({});
                toast.success("Manual edits cleared");
              }}
            >
              Reset {editedCount} edit{editedCount === 1 ? "" : "s"}
            </Btn>
          )}
          {isAdmin && (
            <Btn
              small
              icon="bookmark_add"
              title="Save the current rota to history"
              onClick={() => {
                setSaveLabel(monthLabel);
                setSaveOpen(true);
              }}
            >
              Save
            </Btn>
          )}
          <span className="rota-download">
            <button
              ref={historyBtn}
              type="button"
              className="btn btn-ghost btn-sm"
              aria-haspopup="menu"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((open) => !open)}
            >
              <MIcon name="history" size={15} weight={500} />
              History
              {history.length > 0 && <span className="seg-count">{history.length}</span>}
              <MIcon name="expand_more" size={15} className="dim" />
            </button>
            <Popover
              open={historyOpen}
              onClose={() => setHistoryOpen(false)}
              anchor={historyBtn}
              align="right"
              width={300}
              fixed
            >
              {history.length === 0 ? (
                <div className="hist-empty">No saved schedules yet.</div>
              ) : (
                history.map((schedule) => (
                  <div key={schedule.id} className="hist-item">
                    <button
                      type="button"
                      className="hist-load"
                      title={`Load “${scheduleTitle(schedule)}”`}
                      onClick={() => requestLoad(schedule)}
                    >
                      <span className="hist-label">{scheduleTitle(schedule)}</span>
                      <span className="hist-meta">
                        {monthName(schedule.month)} {schedule.year} · saved {fmtDate(schedule.created_at)}
                      </span>
                    </button>
                    {isAdmin && (
                      <IconBtn
                        icon="delete"
                        size={14}
                        title="Delete from history"
                        onClick={() => {
                          setHistoryOpen(false);
                          setDeleteTarget(schedule);
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </Popover>
          </span>
          <span className="rota-download">
            <button
              ref={downloadBtn}
              type="button"
              className="btn btn-ghost btn-sm"
              aria-haspopup="menu"
              aria-expanded={downloadOpen}
              onClick={() => setDownloadOpen((open) => !open)}
            >
              <MIcon name="download" size={15} weight={500} />
              Download
              <MIcon name="expand_more" size={15} className="dim" />
            </button>
            <Popover
              open={downloadOpen}
              onClose={() => setDownloadOpen(false)}
              anchor={downloadBtn}
              align="right"
              minWidth={188}
              fixed
            >
              {(
                [
                  { format: "xlsx", icon: "table_view", label: "Excel (.xlsx)" },
                  { format: "pdf", icon: "picture_as_pdf", label: "PDF (.pdf)" },
                  { format: "png", icon: "image", label: "Image (.png)" },
                ] as const
              ).map((item) => (
                <button
                  key={item.format}
                  type="button"
                  className="pop-item"
                  onClick={() => handleDownload(item.format)}
                >
                  <span className="rota-download-item">
                    <MIcon name={item.icon} size={16} className="dim" />
                    {item.label}
                  </span>
                </button>
              ))}
            </Popover>
          </span>
          <Btn
            kind="primary"
            small
            icon="casino"
            onClick={() => setConfirmAction({ kind: "regenerate" })}
          >
            Regenerate
          </Btn>
        </div>
      </div>

      <div className="rota-legend">
        <span className="rota-key">
          <span className="cell-d">D</span> Day 07:00–19:00
        </span>
        <span className="rota-key">
          <span className="cell-n">N</span> Night 19:00–07:00
        </span>
        <span className="rota-key">
          <span className="cell-o"></span> Off
        </span>
        {isAdmin && (
          <span className="rota-key">
            <MIcon name="touch_app" size={14} /> Click a cell to cycle Off → Day → Night
          </span>
        )}
      </div>

      <div className="rota-scroll">
        <table className="rota">
          <thead>
            <tr>
              <th className="rota-name-h">Personnel</th>
              {rota.columns.map((date, index) => (
                <th
                  key={index}
                  className={
                    (index % 7 === 0 ? "wk-start" : "") +
                    (date && !date.startsWith(monthPrefix) ? " rota-next" : "")
                  }
                >
                  <span className="rota-wd">{WD[index % 7]}</span>
                  {date ? Number(date.slice(8, 10)) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERSONNEL.map((person) => (
              <tr key={person}>
                <td className="rota-name">
                  <Avatar name={person} size={22} /> {person.split(" ")[0]}
                </td>
                {rota.columns.map((date, index) => {
                  if (!date) {
                    return <td key={index} className={index % 7 === 0 ? "wk-start" : ""} />;
                  }
                  const key = overrideKey(person, date);
                  const value = rota.cells.get(key) ?? null;
                  const edited = key in overrides;
                  return (
                    <td key={index} className={index % 7 === 0 ? "wk-start" : ""}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className={"cell-btn" + (edited ? " cell-edited" : "")}
                          title={`${person} · ${date} · click to change`}
                          onClick={() => cycleCell(person, date)}
                        >
                          <ShiftChip value={value} />
                        </button>
                      ) : (
                        <ShiftChip value={value} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-head">
        <h2>Hours &amp; compliance per person</h2>
      </div>
      <div className="tk-table">
        <div className="tk-row tk-head stats-row">
          <span className="tk-th" style={{ cursor: "default" }}>Person</span>
          <span className="tk-th" style={{ cursor: "default" }}>Day shifts</span>
          <span className="tk-th" style={{ cursor: "default" }}>Nights</span>
          <span className="tk-th" style={{ cursor: "default" }}>Hours</span>
          <span className="tk-th" style={{ cursor: "default" }}>Hours by week</span>
          <span className="tk-th" style={{ cursor: "default" }}>Max consec. nights</span>
          <span className="tk-th" style={{ cursor: "default" }}>Constraints</span>
        </div>
        {PERSONNEL.map((person) => {
          const stats = rota.stats[person];
          const fails = constraints.filter((constraint) => !constraint.test(stats));
          return (
            <div key={person} className="tk-row stats-row" style={{ cursor: "default" }}>
              <span className="prop-person">
                <Avatar name={person} size={22} /> {person}
              </span>
              <span>{stats.totalDayShifts}</span>
              <span>{stats.totalNightShifts}</span>
              <span>
                {stats.totalHours}h <span className="dim">/ {capHours}</span>
              </span>
              <span className="rota-weekly-hours" title="Hours per rota week">
                {stats.weeklyHours.join(" · ")}
              </span>
              <span>{stats.maxConsecutiveNights}</span>
              <span>
                {fails.length === 0 ? (
                  <span className="status-badge st-closed">
                    <MIcon name="check_circle" size={14} fill={1} /> All pass
                  </span>
                ) : (
                  <span className="status-badge st-fail">
                    <MIcon name="error" size={14} fill={1} /> {fails.length} fail
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="panel-head">
        <h2>Hard constraints</h2>
      </div>
      <div className="constraint-row">
        <div className="constraint-card">
          <MIcon name="groups" size={17} className="dim" />
          <span>2 on days &amp; 2 on nights daily · 3rd day person on Wednesdays</span>
          <span className={"status-badge " + (coverageOk ? "st-closed" : "st-fail")}>
            <MIcon name={coverageOk ? "check_circle" : "error"} size={13} fill={1} /> {coverageOk ? "Met" : "Violated"}
          </span>
        </div>
        {constraints.map((constraint) => {
          const ok = PERSONNEL.every((person) => constraint.test(rota.stats[person]));
          return (
            <div key={constraint.label} className="constraint-card">
              <MIcon name={constraint.icon} size={17} className="dim" />
              <span>{constraint.label}</span>
              <span className={"status-badge " + (ok ? "st-closed" : "st-fail")}>
                <MIcon name={ok ? "check_circle" : "error"} size={13} fill={1} /> {ok ? "Met" : "Violated"}
              </span>
            </div>
          );
        })}
      </div>

      <Modal
        open={confirmAction != null}
        onClose={() => setConfirmAction(null)}
        title={confirmView?.title ?? ""}
        width={430}
        footer={
          <div className="row-end">
            <Btn kind="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </Btn>
            {isAdmin && (
              <Btn kind="ghost" icon="bookmark_add" disabled={saving} onClick={() => runConfirmAction(true)}>
                {saving ? "Saving…" : "Save & continue"}
              </Btn>
            )}
            <Btn kind="primary" disabled={saving} onClick={() => runConfirmAction(false)}>
              {confirmView?.proceed ?? "Continue"}
            </Btn>
          </div>
        }
      >
        <p className="dim" style={{ margin: 0 }}>
          {confirmView?.body}
        </p>
      </Modal>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save schedule to history"
        width={430}
        footer={
          <div className="row-end">
            <Btn kind="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Btn>
            <Btn kind="primary" icon="bookmark_add" disabled={saving} onClick={handleSaveConfirm}>
              {saving ? "Saving…" : "Save to history"}
            </Btn>
          </div>
        }
      >
        <Field label="Name">
          <input
            className="input"
            value={saveLabel}
            autoFocus
            placeholder={monthLabel}
            onChange={(event) => setSaveLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSaveConfirm();
            }}
          />
        </Field>
        <p className="dim" style={{ marginTop: 10, fontSize: 12.5 }}>
          Snapshots the current {monthLabel} rota{editedCount > 0 ? ` with your ${editCountLabel}` : ""} so you can
          reload it from History later.
        </p>
      </Modal>

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title={`Delete “${deleteTarget ? scheduleTitle(deleteTarget) : ""}”?`}
        body="This removes the saved schedule from history. It can't be undone."
        onConfirm={handleDeleteSchedule}
      />
    </div>
  );
}
