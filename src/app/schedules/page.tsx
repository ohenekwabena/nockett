"use client";

import { useMemo, useState } from "react";
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
import { useAuth } from "@/context/auth-context";
import { Avatar, Btn, EmptyState, IconBtn, MIcon } from "@/components/nk/ui";

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
  const { isAdmin } = useAuth();
  const today = new Date();
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [seed, setSeed] = useState(() => defaultRotaSeed(today.getFullYear(), today.getMonth() + 1));
  const [overrides, setOverrides] = useState<Record<string, ShiftValue>>({});

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
  const monthLabel = `${monthName(period.month)} ${period.year}`;

  function shiftPeriod(delta: number) {
    const next = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));
    const value = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    setPeriod(value);
    setSeed(defaultRotaSeed(value.year, value.month));
    setOverrides({});
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

  async function handleDownload() {
    if (!base.schedule || !rota) return;
    try {
      await exportRotaToExcel({
        year: period.year,
        month: period.month,
        weeks: base.schedule.weeks,
        days: rota.days,
      });
      toast.success(`Downloaded ${monthLabel} rota`);
    } catch {
      toast.error("Could not build the rota spreadsheet");
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

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="calendar_month" size={20} className="accent" fill={1} />
          <h1>Shift schedule</h1>
        </div>
        <div className="page-actions">
          <span className="rota-month">
            <IconBtn icon="chevron_left" title="Previous month" onClick={() => shiftPeriod(-1)} />
            <span className="rota-month-label">{monthLabel}</span>
            <IconBtn icon="chevron_right" title="Next month" onClick={() => shiftPeriod(1)} />
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
          <Btn small icon="download" onClick={handleDownload}>
            Download
          </Btn>
          <Btn
            kind="primary"
            small
            icon="casino"
            onClick={() => {
              setSeed(Math.floor(Math.random() * 1e9));
              setOverrides({});
              toast.success("Generated a new valid rota");
            }}
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
    </div>
  );
}
