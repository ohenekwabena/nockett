"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { generateSchedule, getScheduleStats, type ScheduleData } from "@/lib/schedule-service";
import { Avatar, Btn, EmptyState, MIcon } from "@/components/nk/ui";

const WD = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface PersonStats {
  totalDayShifts: number;
  totalNightShifts: number;
  totalHours: number;
  maxConsecutiveNights: number;
  maxWeeklyDays: number;
}

const CONSTRAINTS: Array<{ icon: string; label: string; test: (stats: PersonStats) => boolean }> = [
  { icon: "bedtime", label: "Max 2 consecutive night shifts", test: (s) => s.maxConsecutiveNights <= 2 },
  { icon: "date_range", label: "Max 4 working days per week", test: (s) => s.maxWeeklyDays <= 4 },
  { icon: "timer", label: "Max 180 hours per month", test: (s) => s.totalHours <= 180 },
  {
    icon: "balance",
    label: "Balanced day / night distribution",
    test: (s) => Math.abs(s.totalDayShifts - s.totalNightShifts) <= 3,
  },
];

/** Person × 28-day grid ("D" | "N" | null) from the week/day shift lists. */
function toGrid(schedule: ScheduleData[], personnel: string[]): Record<string, Array<"D" | "N" | null>> {
  const grid: Record<string, Array<"D" | "N" | null>> = {};
  personnel.forEach((person) => {
    grid[person] = Array(28).fill(null);
  });
  for (const item of schedule) {
    const dayIndex = (item.week - 1) * 7 + DAY_ORDER.indexOf(item.day);
    if (dayIndex < 0 || dayIndex >= 28) continue;
    item.dayShift.forEach((person) => {
      if (grid[person]) grid[person][dayIndex] = "D";
    });
    item.nightShift.forEach((person) => {
      if (grid[person]) grid[person][dayIndex] = "N";
    });
  }
  return grid;
}

export default function SchedulesPage() {
  const [seed, setSeed] = useState(20260702);

  const rota = useMemo(() => {
    try {
      const schedule = generateSchedule(seed);
      const stats = getScheduleStats(schedule);
      const personnel = Object.keys(stats);
      return { schedule, stats, personnel, grid: toGrid(schedule, personnel), error: null as string | null };
    } catch (error) {
      return {
        schedule: [] as ScheduleData[],
        stats: {} as ReturnType<typeof getScheduleStats>,
        personnel: [] as string[],
        grid: {} as Record<string, Array<"D" | "N" | null>>,
        error: error instanceof Error ? error.message : "Failed to generate a rota",
      };
    }
  }, [seed]);

  if (rota.error) {
    return (
      <div className="page">
        <EmptyState
          icon="calendar_month"
          title="Could not generate a rota"
          body={rota.error}
          action={
            <Btn small kind="primary" onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>
              Try again
            </Btn>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="calendar_month" size={20} className="accent" fill={1} />
          <h1>Shift schedule</h1>
        </div>
        <div className="page-actions">
          <span className="dim" style={{ fontSize: 12.5 }}>
            4-week rota · 12h shifts · 2+ per shift
          </span>
          <Btn
            kind="primary"
            small
            icon="casino"
            onClick={() => {
              setSeed(Math.floor(Math.random() * 1e9));
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
      </div>

      <div className="rota-scroll">
        <table className="rota">
          <thead>
            <tr>
              <th className="rota-name-h">Personnel</th>
              {Array.from({ length: 28 }, (_, day) => (
                <th key={day} className={day % 7 === 0 ? "wk-start" : ""}>
                  <span className="rota-wd">{WD[day % 7]}</span>
                  {day + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rota.personnel.map((person) => (
              <tr key={person}>
                <td className="rota-name">
                  <Avatar name={person} size={22} /> {person.split(" ")[0]}
                </td>
                {rota.grid[person].map((cell, day) => (
                  <td key={day} className={day % 7 === 0 ? "wk-start" : ""}>
                    {cell === "D" ? (
                      <span className="cell-d">D</span>
                    ) : cell === "N" ? (
                      <span className="cell-n">N</span>
                    ) : (
                      <span className="cell-o"></span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-head">
        <h2>Compliance per person</h2>
      </div>
      <div className="tk-table">
        <div className="tk-row tk-head stats-row">
          <span className="tk-th" style={{ cursor: "default" }}>Person</span>
          <span className="tk-th" style={{ cursor: "default" }}>Day shifts</span>
          <span className="tk-th" style={{ cursor: "default" }}>Nights</span>
          <span className="tk-th" style={{ cursor: "default" }}>Hours</span>
          <span className="tk-th" style={{ cursor: "default" }}>Max consec. nights</span>
          <span className="tk-th" style={{ cursor: "default" }}>Constraints</span>
        </div>
        {rota.personnel.map((person) => {
          const stats = rota.stats[person];
          const fails = CONSTRAINTS.filter((constraint) => !constraint.test(stats));
          return (
            <div key={person} className="tk-row stats-row" style={{ cursor: "default" }}>
              <span className="prop-person">
                <Avatar name={person} size={22} /> {person}
              </span>
              <span>{stats.totalDayShifts}</span>
              <span>{stats.totalNightShifts}</span>
              <span>
                {stats.totalHours}h <span className="dim">/ 180</span>
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
        {CONSTRAINTS.map((constraint) => {
          const ok = rota.personnel.every((person) => constraint.test(rota.stats[person]));
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
