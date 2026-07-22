import { describe, expect, it } from "vitest";
import {
  applyShiftOverrides,
  buildMonthWeeks,
  dateOrdinalLabel,
  defaultRotaSeed,
  generateMonthSchedule,
  getScheduleStats,
  maxShiftsForDays,
  overrideKey,
  PERSONNEL,
  SHIFT_HOURS,
} from "./schedule-service";

describe("buildMonthWeeks", () => {
  it("lays out July 2026 like the published roster (Wed 1st start, ends Sun 2nd Aug)", () => {
    const weeks = buildMonthWeeks(2026, 7);

    expect(weeks).toHaveLength(5);
    expect(weeks[0].dates.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0].dates[2]).toBe("2026-07-01");
    expect(weeks[0].dates[6]).toBe("2026-07-05");
    expect(weeks[4].dates[0]).toBe("2026-07-27");
    expect(weeks[4].dates[6]).toBe("2026-08-02");

    const scheduledDays = weeks.flatMap((week) => week.dates).filter(Boolean).length;
    expect(scheduledDays).toBe(33);
  });

  it("handles a Sunday-start month (November 2026) with a 1-day first week", () => {
    const weeks = buildMonthWeeks(2026, 11);

    expect(weeks[0].dates.filter(Boolean)).toEqual(["2026-11-01"]);
    expect(weeks[weeks.length - 1].dates[6]).toBe("2026-12-06");
  });

  it("gives a Monday-start 28-day month exactly 4 full weeks (February 2027)", () => {
    const weeks = buildMonthWeeks(2027, 2);

    expect(weeks).toHaveLength(4);
    expect(weeks.every((week) => week.dates.every(Boolean))).toBe(true);
    expect(weeks[0].dates[0]).toBe("2027-02-01");
    expect(weeks[3].dates[6]).toBe("2027-02-28");
  });
});

describe("dateOrdinalLabel", () => {
  it("formats like the roster date row", () => {
    expect(dateOrdinalLabel("2026-07-01")).toBe("1st July");
    expect(dateOrdinalLabel("2026-07-22")).toBe("22nd July");
    expect(dateOrdinalLabel("2026-07-13")).toBe("13th July");
    expect(dateOrdinalLabel("2026-07-31")).toBe("31st July");
    expect(dateOrdinalLabel("2026-08-02")).toBe("2nd August");
  });
});

describe("generateMonthSchedule", () => {
  const CASES: Array<[year: number, month: number]> = [
    [2026, 7], // Wednesday start, 5 weeks
    [2026, 8], // Saturday start, weekend-only first week
    [2026, 11], // Sunday start, 1-day first week, 6 weeks
    [2027, 2], // Monday start, exactly 4 weeks
  ];

  it.each(CASES)("produces a valid rota for %i-%i", (year, month) => {
    const schedule = generateMonthSchedule(year, month, defaultRotaSeed(year, month));
    const { days, weeks, scheduledDays, maxShifts } = schedule;

    expect(days).toHaveLength(scheduledDays);
    expect(maxShifts).toBe(maxShiftsForDays(scheduledDays));

    for (const day of days) {
      // 2 on days, except Wednesdays which take a third person
      expect(day.dayShift).toHaveLength(day.weekdayIndex === 2 ? 3 : 2);
      expect(day.nightShift).toHaveLength(2);
      expect(day.dayShift.some((person) => day.nightShift.includes(person))).toBe(false);
    }

    const stats = getScheduleStats(days, weeks.length);
    for (const person of PERSONNEL) {
      expect(stats[person].maxConsecutiveNights).toBeLessThanOrEqual(2);
      expect(stats[person].maxConsecutiveDayShifts).toBeLessThanOrEqual(3);
      expect(stats[person].maxWeeklyDays).toBeLessThanOrEqual(4);
      expect(stats[person].totalHours).toBeLessThanOrEqual(maxShifts * SHIFT_HOURS);
      expect(stats[person].nightToDayViolations).toBe(0);
    }
  });

  it("keeps rest rules and Wednesday staffing across seeds", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { days, weeks } = generateMonthSchedule(2026, 7, seed * 7919);
      for (let i = 1; i < days.length; i++) {
        const overlap = days[i].dayShift.filter((person) => days[i - 1].nightShift.includes(person));
        expect(overlap).toEqual([]);
      }
      for (const day of days) {
        expect(day.dayShift).toHaveLength(day.weekdayIndex === 2 ? 3 : 2);
      }
      const stats = getScheduleStats(days, weeks.length);
      for (const person of PERSONNEL) {
        expect(stats[person].maxConsecutiveDayShifts).toBeLessThanOrEqual(3);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateMonthSchedule(2026, 7, 123);
    const b = generateMonthSchedule(2026, 7, 123);
    expect(a.days).toEqual(b.days);
  });
});

describe("getScheduleStats", () => {
  it("tracks hours per week and in total", () => {
    const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
    const stats = getScheduleStats(schedule.days, schedule.weeks.length);

    for (const person of PERSONNEL) {
      const { totalDayShifts, totalNightShifts, totalHours, weeklyHours } = stats[person];
      expect(totalHours).toBe((totalDayShifts + totalNightShifts) * SHIFT_HOURS);
      expect(weeklyHours).toHaveLength(schedule.weeks.length);
      expect(weeklyHours.reduce((sum, hours) => sum + hours, 0)).toBe(totalHours);
    }
  });
});

describe("applyShiftOverrides", () => {
  it("moves a person between day, night, and off — and the hours follow", () => {
    const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
    const day = schedule.days[0];
    const worker = day.dayShift[0];
    const resting = PERSONNEL.find(
      (person) => !day.dayShift.includes(person) && !day.nightShift.includes(person),
    )!;
    const before = getScheduleStats(schedule.days, schedule.weeks.length);

    // Clear a working slot
    const cleared = applyShiftOverrides(schedule.days, { [overrideKey(worker, day.date)]: null });
    expect(cleared[0].dayShift).not.toContain(worker);
    const clearedStats = getScheduleStats(cleared, schedule.weeks.length);
    expect(clearedStats[worker].totalHours).toBe(before[worker].totalHours - SHIFT_HOURS);
    expect(clearedStats[worker].weeklyHours[day.week - 1]).toBe(before[worker].weeklyHours[day.week - 1] - SHIFT_HOURS);

    // Fill an empty slot with a night shift
    const filled = applyShiftOverrides(schedule.days, { [overrideKey(resting, day.date)]: "N" });
    expect(filled[0].nightShift).toContain(resting);
    const filledStats = getScheduleStats(filled, schedule.weeks.length);
    expect(filledStats[resting].totalHours).toBe(before[resting].totalHours + SHIFT_HOURS);
    expect(filledStats[resting].weeklyHours[day.week - 1]).toBe(before[resting].weeklyHours[day.week - 1] + SHIFT_HOURS);

    // Switch a day slot to night
    const switched = applyShiftOverrides(schedule.days, { [overrideKey(worker, day.date)]: "N" });
    expect(switched[0].dayShift).not.toContain(worker);
    expect(switched[0].nightShift).toContain(worker);
  });

  it("flags a manually created 4-day run of day shifts", () => {
    const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
    const person = PERSONNEL[0];
    const overrides = Object.fromEntries(
      schedule.days.slice(0, 4).map((day) => [overrideKey(person, day.date), "D" as const]),
    );

    const edited = applyShiftOverrides(schedule.days, overrides);
    const stats = getScheduleStats(edited, schedule.weeks.length);

    expect(stats[person].maxConsecutiveDayShifts).toBeGreaterThanOrEqual(4);
  });

  it("flags a manually created night-into-day sequence", () => {
    const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
    const [first, second] = schedule.days;
    const nightWorker = first.nightShift[0];

    const edited = applyShiftOverrides(schedule.days, { [overrideKey(nightWorker, second.date)]: "D" });
    const stats = getScheduleStats(edited, schedule.weeks.length);

    expect(stats[nightWorker].nightToDayViolations).toBe(1);
  });

  it("returns the base days untouched when there are no overrides", () => {
    const schedule = generateMonthSchedule(2026, 7, defaultRotaSeed(2026, 7));
    expect(applyShiftOverrides(schedule.days, {})).toBe(schedule.days);
  });
});
