export type ShiftValue = "D" | "N" | null;

export interface RotaWeek {
  week: number;
  /** 7 slots, Monday-first. null = the slot falls before the 1st of the month. */
  dates: (string | null)[];
}

export interface ScheduleDay {
  /** ISO date, yyyy-mm-dd */
  date: string;
  week: number;
  /** 0 = Monday … 6 = Sunday */
  weekdayIndex: number;
  dayShift: string[];
  nightShift: string[];
}

export interface MonthSchedule {
  year: number;
  month: number;
  weeks: RotaWeek[];
  days: ScheduleDay[];
  scheduledDays: number;
  maxShifts: number;
}

export interface PersonScheduleStats {
  totalDayShifts: number;
  totalNightShifts: number;
  totalHours: number;
  /** Hours worked in each rota week, index 0 = week 1. */
  weeklyHours: number[];
  maxConsecutiveNights: number;
  maxConsecutiveDayShifts: number;
  maxWeeklyDays: number;
  /** Times the person works a day shift immediately after a night shift (zero rest). */
  nightToDayViolations: number;
}

export const PERSONNEL = ["Jesse", "Owusu", "Lawrence", "Kwabena", "Peter", "Florence", "Emmanuel", "Emmanuella"];

export const SHIFT_HOURS = 12;
export const MAX_CONSECUTIVE_NIGHTS = 2;
export const MAX_CONSECUTIVE_DAY_SHIFTS = 3;
export const MAX_DAYS_PER_WEEK = 4;

/**
 * Allowed |day shifts - night shifts| per person. Weeks are assigned whole,
 * so in a 5/6-week window half the roster necessarily gets one more day-week
 * than night-weeks (or vice versa) — a ±3 spread is only guaranteed
 * reachable in an exact 4-week window; longer windows get ±4.
 */
export function dayNightImbalanceLimit(scheduledDays: number): number {
  return scheduledDays <= BASELINE_DAYS ? 3 : 4;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const WEEKDAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DAY_SHIFT_SIZE = 2; // 2 on day shift…
const WEDNESDAY_DAY_SHIFT_SIZE = 3; // …except Wednesdays, which take a third person
const WEDNESDAY_INDEX = 2;
const NIGHT_SHIFT_SIZE = 2; // Fixed 2 on night shift
const BASELINE_DAYS = 28;
const BASELINE_MAX_SHIFTS = 15; // 180h over a 28-day window at 12h per shift
const MAX_ATTEMPTS = 2000;

type PersonCounter = Record<string, number>;
type PersonWeekCounter = Record<string, number[]>;

interface SolverState {
  totalShifts: PersonCounter;
  dayShifts: PersonCounter;
  nightShifts: PersonCounter;
  weeklyShifts: PersonWeekCounter;
  consecutiveNights: PersonCounter;
  consecutiveDayShifts: PersonCounter;
}

interface WeekTeamPlan {
  dayTeam: string[];
  nightTeam: string[];
}

interface PairPlan {
  primary: string[];
  secondary: string[];
  primaryDays: Set<number>;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

/** "1st July", "22nd July", "2nd August" — the date labels used on the exported roster. */
export function dateOrdinalLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00Z");
  const day = date.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${MONTH_NAMES[date.getUTCMonth()]}`;
}

/**
 * Monday-aligned week blocks covering a month. The first week has null slots
 * before the 1st; the last week runs past month-end to its closing Sunday
 * (so July 2026 ends on Sunday 2nd August, matching the published roster).
 */
export function buildMonthWeeks(year: number, month: number): RotaWeek[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const totalSlots = Math.ceil((lead + daysInMonth) / 7) * 7;

  const weeks: RotaWeek[] = [];
  for (let slot = 0; slot < totalSlots; slot += 7) {
    const dates: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const offset = slot + i - lead;
      dates.push(offset < 0 ? null : toIso(new Date(Date.UTC(year, month - 1, 1 + offset))));
    }
    weeks.push({ week: weeks.length + 1, dates });
  }
  return weeks;
}

/**
 * Shift cap pro-rated to the window length. 24/7 cover for 8 people needs
 * ~16.5 shifts each over a 33-day window, so the flat 15-shift (180h) cap is
 * infeasible beyond 28 days; scale it and report actual hours in the stats.
 */
export function maxShiftsForDays(scheduledDays: number): number {
  return Math.ceil((BASELINE_MAX_SHIFTS * scheduledDays) / BASELINE_DAYS);
}

export function defaultRotaSeed(year: number, month: number): number {
  return year * 10000 + month * 100 + 7;
}

export function generateMonthSchedule(year: number, month: number, seed: number): MonthSchedule {
  const weeks = buildMonthWeeks(year, month);
  const scheduledDays = weeks.reduce((count, week) => count + week.dates.filter(Boolean).length, 0);
  const maxShifts = maxShiftsForDays(scheduledDays);

  let lastError = "Unknown failure.";
  let failureDate = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const random = makeRandom(seed + attempt * 9973);
    const result = generateAttempt(random, weeks, maxShifts);

    if (result.days) {
      return { year, month, weeks, days: result.days, scheduledDays, maxShifts };
    }

    lastError = result.error;
    failureDate = result.failureDate;
  }

  const dayInfo = failureDate
    ? `\nFailed to fill shifts on ${failureDate}.\nLikely cause: Not enough eligible personnel for ${lastError}.`
    : "";

  throw new Error(
    `Unable to generate a valid schedule after ${MAX_ATTEMPTS} attempts.\n` +
      `Constraints: ${DAY_SHIFT_SIZE} day shift (${WEDNESDAY_DAY_SHIFT_SIZE} on Wednesdays) + ${NIGHT_SHIFT_SIZE} night shift per day, ` +
      `4 day-team personnel + 4 night-team personnel per week, shifts assigned in stable pairs.\n` +
      `Max consecutive nights: ${MAX_CONSECUTIVE_NIGHTS}, max consecutive day shifts: ${MAX_CONSECUTIVE_DAY_SHIFTS}, ` +
      `no day shift straight after a night, max shifts: ${maxShifts} (${maxShifts * SHIFT_HOURS}h), ` +
      `max days/week: ${MAX_DAYS_PER_WEEK}, day/night imbalance <= ${dayNightImbalanceLimit(scheduledDays)}.` +
      `${dayInfo}`,
  );
}

function generateAttempt(
  random: () => number,
  weeks: RotaWeek[],
  maxShifts: number,
): { days: ScheduleDay[] | null; error: string; failureDate: string } {
  const days: ScheduleDay[] = [];
  const state = createInitialState(weeks.length);
  const weeklyPlans = buildWeeklyTeamPlans(random, weeks);

  for (const rotaWeek of weeks) {
    const week = rotaWeek.week;
    const plan = weeklyPlans[week - 1];

    // Coming off last week's nights: one night blocks the next day shift,
    // two consecutive nights block a third night.
    const dayBlocked = new Set(PERSONNEL.filter((person) => state.consecutiveNights[person] > 0));
    const nightBlocked = new Set(
      PERSONNEL.filter((person) => state.consecutiveNights[person] >= MAX_CONSECUTIVE_NIGHTS),
    );

    const dayPairPlan = buildPairPlan(plan.dayTeam, state, random, dayBlocked, false);
    const nightPairPlan = buildPairPlan(plan.nightTeam, state, random, nightBlocked, true);

    for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex++) {
      const date = rotaWeek.dates[weekdayIndex];
      if (!date) continue;

      const preferredDayPair = dayPairPlan.primaryDays.has(weekdayIndex) ? dayPairPlan.primary : dayPairPlan.secondary;
      const altDayPair = preferredDayPair === dayPairPlan.primary ? dayPairPlan.secondary : dayPairPlan.primary;

      const chosenDayPair = isPairEligible(preferredDayPair, week, state, false, maxShifts)
        ? preferredDayPair
        : isPairEligible(altDayPair, week, state, false, maxShifts)
          ? altDayPair
          : null;

      if (!chosenDayPair) {
        return { days: null, error: "day shift pair eligibility exhausted", failureDate: date };
      }

      const dayShift = [...chosenDayPair];

      // Wednesdays require a third person on the day shift; give it to the
      // eligible teammate furthest behind on day shifts
      if (weekdayIndex === WEDNESDAY_INDEX) {
        const extraCandidates = shuffle([...plan.dayTeam], random).sort(
          (a, b) => state.dayShifts[a] - state.nightShifts[a] - (state.dayShifts[b] - state.nightShifts[b]),
        );
        let extraAdded = false;
        for (const extra of extraCandidates) {
          if (dayShift.includes(extra)) {
            continue;
          }

          if (!isPersonEligible(extra, week, state, false, maxShifts)) {
            continue;
          }

          dayShift.push(extra);
          extraAdded = true;
          break;
        }

        if (!extraAdded) {
          return { days: null, error: "third person for the Wednesday day shift", failureDate: date };
        }
      }

      const preferredNightPair = nightPairPlan.primaryDays.has(weekdayIndex)
        ? nightPairPlan.primary
        : nightPairPlan.secondary;
      const altNightPair =
        preferredNightPair === nightPairPlan.primary ? nightPairPlan.secondary : nightPairPlan.primary;

      let chosenNightPair: string[] | null = null;
      if (isPairEligible(preferredNightPair, week, state, true, maxShifts)) {
        chosenNightPair = preferredNightPair;
      } else if (isPairEligible(altNightPair, week, state, true, maxShifts)) {
        chosenNightPair = altNightPair;
      }

      if (!chosenNightPair) {
        return { days: null, error: "night shift pair eligibility exhausted", failureDate: date };
      }

      const nightShift = [...chosenNightPair];

      applyShift(dayShift, week, state, false);
      applyShift(nightShift, week, state, true);

      for (const person of PERSONNEL) {
        if (!nightShift.includes(person)) {
          state.consecutiveNights[person] = 0;
        }
        if (!dayShift.includes(person)) {
          state.consecutiveDayShifts[person] = 0;
        }
      }

      days.push({ date, week, weekdayIndex, dayShift, nightShift });
    }
  }

  if (validateSchedule(days, weeks, maxShifts)) {
    return { days, error: "", failureDate: "" };
  }

  return { days: null, error: "validation (one or more constraints violated)", failureDate: "" };
}

/**
 * Splits the roster into a day team and night team for each week, balancing
 * per person across the actual window. The old fixed stride-2 rotation only
 * closed its cycle every 4 weeks, so 5/6-week month windows structurally gave
 * some people far more day-weeks than night-weeks (or vice versa). Instead,
 * track each person's day-minus-night load in active-day units (partial month
 * edge weeks count for what they are actually worth) and put the four most
 * night-heavy people on the day team each week; shuffling before the stable
 * sort randomises tie-breaks so retries explore different splits.
 */
function buildWeeklyTeamPlans(random: () => number, weeks: RotaWeek[]): WeekTeamPlan[] {
  const bias: PersonCounter = {};
  for (const person of PERSONNEL) {
    bias[person] = 0;
  }

  const plans: WeekTeamPlan[] = [];
  for (const rotaWeek of weeks) {
    const activeDays = rotaWeek.dates.filter(Boolean).length;
    const ordered = shuffle([...PERSONNEL], random).sort((a, b) => bias[a] - bias[b]);
    const dayTeam = ordered.slice(0, 4);
    const nightTeam = ordered.slice(4);

    for (const person of dayTeam) {
      bias[person] += activeDays;
    }
    for (const person of nightTeam) {
      bias[person] -= activeDays;
    }

    plans.push({ dayTeam, nightTeam });
  }

  return plans;
}

function buildPairPlan(
  team: string[],
  state: SolverState,
  random: () => number,
  blocked: Set<string>,
  isNight: boolean,
): PairPlan {
  // How far ahead this person already is on the shift type being planned;
  // the most-behind people get the heavier primary role so day/night totals
  // converge instead of drifting apart in 5/6-week windows.
  const surplus = (person: string) =>
    isNight
      ? state.nightShifts[person] - state.dayShifts[person]
      : state.dayShifts[person] - state.nightShifts[person];

  // Members who cannot work the week's first day (fresh off last week's
  // nights) must share a pair, otherwise both pairs are ineligible to open
  // the week. The night shift holds 2 people, so there are at most 2.
  const blockedMembers = team.filter((person) => blocked.has(person));

  let pair1: string[];
  let pair2: string[];
  if (blockedMembers.length === 2) {
    pair1 = blockedMembers;
    pair2 = team.filter((person) => !blocked.has(person));
  } else {
    const ordered = shuffle([...team], random).sort(
      (a, b) => surplus(a) - surplus(b) || state.totalShifts[a] - state.totalShifts[b],
    );
    pair1 = [ordered[0], ordered[1]];
    pair2 = [ordered[2], ordered[3]];
  }

  const score1 = surplus(pair1[0]) + surplus(pair1[1]);
  const score2 = surplus(pair2[0]) + surplus(pair2[1]);

  const primary = score1 <= score2 ? pair1 : pair2;
  const secondary = score1 <= score2 ? pair2 : pair1;
  const patternOptions = [
    [0, 2, 3, 5],
    [0, 1, 3, 5],
    [1, 3, 4, 6],
    [0, 2, 4, 6],
  ];
  const pattern = patternOptions[Math.floor(random() * patternOptions.length)];

  return {
    primary,
    secondary,
    primaryDays: new Set<number>(pattern),
  };
}

function isPersonEligible(person: string, week: number, state: SolverState, isNight: boolean, maxShifts: number): boolean {
  if (state.totalShifts[person] >= maxShifts) {
    return false;
  }

  if (state.weeklyShifts[person][week - 1] >= MAX_DAYS_PER_WEEK) {
    return false;
  }

  if (isNight && state.consecutiveNights[person] >= MAX_CONSECUTIVE_NIGHTS) {
    return false;
  }

  // A night shift ends 7am, the day shift starts 7am the same morning:
  // whoever worked last night cannot take today's day shift.
  if (!isNight && state.consecutiveNights[person] > 0) {
    return false;
  }

  if (!isNight && state.consecutiveDayShifts[person] >= MAX_CONSECUTIVE_DAY_SHIFTS) {
    return false;
  }

  return true;
}

function isPairEligible(pair: string[], week: number, state: SolverState, isNight: boolean, maxShifts: number): boolean {
  return pair.every((person) => isPersonEligible(person, week, state, isNight, maxShifts));
}

function applyShift(people: string[], week: number, state: SolverState, isNight: boolean): void {
  for (const person of people) {
    state.totalShifts[person] += 1;
    state.weeklyShifts[person][week - 1] += 1;

    if (isNight) {
      state.nightShifts[person] += 1;
      state.consecutiveNights[person] += 1;
      state.consecutiveDayShifts[person] = 0;
    } else {
      state.dayShifts[person] += 1;
      state.consecutiveNights[person] = 0;
      state.consecutiveDayShifts[person] += 1;
    }
  }
}

function validateSchedule(days: ScheduleDay[], weeks: RotaWeek[], maxShifts: number): boolean {
  const personDayCounts: PersonCounter = {};
  const personNightCounts: PersonCounter = {};
  const personDaysPerWeek: PersonWeekCounter = {};
  const personConsecutiveNights: PersonCounter = {};
  const personConsecutiveDays: PersonCounter = {};

  for (const person of PERSONNEL) {
    personDayCounts[person] = 0;
    personNightCounts[person] = 0;
    personDaysPerWeek[person] = Array(weeks.length).fill(0);
    personConsecutiveNights[person] = 0;
    personConsecutiveDays[person] = 0;
  }

  for (const entry of days) {
    const requiredDaySize = entry.weekdayIndex === WEDNESDAY_INDEX ? WEDNESDAY_DAY_SHIFT_SIZE : DAY_SHIFT_SIZE;
    if (entry.dayShift.length !== requiredDaySize) {
      return false;
    }

    if (entry.nightShift.length !== NIGHT_SHIFT_SIZE) {
      return false;
    }

    if (entry.dayShift.some((person) => entry.nightShift.includes(person))) {
      return false;
    }

    // At this point the counters still describe yesterday: a positive streak
    // means the person worked last night and cannot take today's day shift.
    if (entry.dayShift.some((person) => personConsecutiveNights[person] > 0)) {
      return false;
    }

    for (const person of PERSONNEL) {
      if (entry.nightShift.includes(person)) {
        personConsecutiveNights[person] += 1;
      } else {
        personConsecutiveNights[person] = 0;
      }

      if (personConsecutiveNights[person] > MAX_CONSECUTIVE_NIGHTS) {
        return false;
      }

      if (entry.dayShift.includes(person)) {
        personConsecutiveDays[person] += 1;
      } else {
        personConsecutiveDays[person] = 0;
      }

      if (personConsecutiveDays[person] > MAX_CONSECUTIVE_DAY_SHIFTS) {
        return false;
      }
    }

    for (const person of entry.dayShift) {
      personDayCounts[person] += 1;
      personDaysPerWeek[person][entry.week - 1] += 1;
    }

    for (const person of entry.nightShift) {
      personNightCounts[person] += 1;
      personDaysPerWeek[person][entry.week - 1] += 1;
    }
  }

  for (const rotaWeek of weeks) {
    const activeDays = rotaWeek.dates.filter(Boolean).length;
    const weekEntries = days.filter((entry) => entry.week === rotaWeek.week);

    if (weekEntries.length !== activeDays) {
      return false;
    }

    const dayPersonnel = new Set(weekEntries.flatMap((entry) => entry.dayShift));
    const nightPersonnel = new Set(weekEntries.flatMap((entry) => entry.nightShift));
    const isFullWeek = activeDays === 7;

    // A full week uses the whole 4-person day team and 4-person night team;
    // partial weeks (month edges) may only get through one pair each.
    if (isFullWeek ? dayPersonnel.size !== 4 : dayPersonnel.size < 2) {
      return false;
    }

    if (isFullWeek ? nightPersonnel.size !== 4 : nightPersonnel.size < 2) {
      return false;
    }

    for (const person of dayPersonnel) {
      if (nightPersonnel.has(person)) {
        return false;
      }
    }

    const minPairRuns = Math.ceil(activeDays / 2);
    const dayPairCount = countPairOccurrences(weekEntries.map((entry) => entry.dayShift));
    const nightPairCount = countPairOccurrences(weekEntries.map((entry) => entry.nightShift));

    if (dayPairCount < minPairRuns) {
      return false;
    }

    if (nightPairCount < minPairRuns) {
      return false;
    }
  }

  for (const person of PERSONNEL) {
    if (personDayCounts[person] + personNightCounts[person] > maxShifts) {
      return false;
    }

    if (Math.abs(personDayCounts[person] - personNightCounts[person]) > dayNightImbalanceLimit(days.length)) {
      return false;
    }

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      if (personDaysPerWeek[person][weekIndex] > MAX_DAYS_PER_WEEK) {
        return false;
      }
    }
  }

  return true;
}

function createInitialState(weekCount: number): SolverState {
  const totalShifts: PersonCounter = {};
  const dayShifts: PersonCounter = {};
  const nightShifts: PersonCounter = {};
  const weeklyShifts: PersonWeekCounter = {};
  const consecutiveNights: PersonCounter = {};
  const consecutiveDayShifts: PersonCounter = {};

  for (const person of PERSONNEL) {
    totalShifts[person] = 0;
    dayShifts[person] = 0;
    nightShifts[person] = 0;
    weeklyShifts[person] = Array(weekCount).fill(0);
    consecutiveNights[person] = 0;
    consecutiveDayShifts[person] = 0;
  }

  return {
    totalShifts,
    dayShifts,
    nightShifts,
    weeklyShifts,
    consecutiveNights,
    consecutiveDayShifts,
  };
}

function countPairOccurrences(shifts: string[][]): number {
  const pairCounts: Record<string, number> = {};

  for (const shift of shifts) {
    for (let i = 0; i < shift.length; i++) {
      for (let j = i + 1; j < shift.length; j++) {
        const key = [shift[i], shift[j]].sort().join("|");
        pairCounts[key] = (pairCounts[key] ?? 0) + 1;
      }
    }
  }

  return Math.max(0, ...Object.values(pairCounts));
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeRandom(seed: number): () => number {
  let t = seed >>> 0;

  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function overrideKey(person: string, date: string): string {
  return `${person}|${date}`;
}

/**
 * Re-derives each day's shift lists with the admin's manual cell edits applied.
 * Keys are overrideKey(person, date); a null value clears the person's shift.
 */
export function applyShiftOverrides(days: ScheduleDay[], overrides: Record<string, ShiftValue>): ScheduleDay[] {
  if (Object.keys(overrides).length === 0) {
    return days;
  }

  return days.map((day) => {
    const shiftOf = (person: string): ShiftValue => {
      const key = overrideKey(person, day.date);
      if (key in overrides) {
        return overrides[key];
      }
      return day.dayShift.includes(person) ? "D" : day.nightShift.includes(person) ? "N" : null;
    };

    return {
      ...day,
      dayShift: PERSONNEL.filter((person) => shiftOf(person) === "D"),
      nightShift: PERSONNEL.filter((person) => shiftOf(person) === "N"),
    };
  });
}

export function getScheduleStats(days: ScheduleDay[], weekCount: number): Record<string, PersonScheduleStats> {
  const stats: Record<string, PersonScheduleStats> = {};
  const currentConsecutiveNights: PersonCounter = {};
  const currentConsecutiveDays: PersonCounter = {};
  const weeklyShiftCounts: PersonWeekCounter = {};

  for (const person of PERSONNEL) {
    stats[person] = {
      totalDayShifts: 0,
      totalNightShifts: 0,
      totalHours: 0,
      weeklyHours: Array(weekCount).fill(0),
      maxConsecutiveNights: 0,
      maxConsecutiveDayShifts: 0,
      maxWeeklyDays: 0,
      nightToDayViolations: 0,
    };
    currentConsecutiveNights[person] = 0;
    currentConsecutiveDays[person] = 0;
    weeklyShiftCounts[person] = Array(weekCount).fill(0);
  }

  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));

  for (const item of ordered) {
    for (const person of item.dayShift) {
      stats[person].totalDayShifts += 1;
      weeklyShiftCounts[person][item.week - 1] += 1;
      if (currentConsecutiveNights[person] > 0) {
        stats[person].nightToDayViolations += 1;
      }
      currentConsecutiveNights[person] = 0;
      currentConsecutiveDays[person] += 1;
      stats[person].maxConsecutiveDayShifts = Math.max(
        stats[person].maxConsecutiveDayShifts,
        currentConsecutiveDays[person],
      );
    }

    for (const person of item.nightShift) {
      stats[person].totalNightShifts += 1;
      weeklyShiftCounts[person][item.week - 1] += 1;
      currentConsecutiveNights[person] += 1;
      stats[person].maxConsecutiveNights = Math.max(
        stats[person].maxConsecutiveNights,
        currentConsecutiveNights[person],
      );
    }

    for (const person of PERSONNEL) {
      if (!item.nightShift.includes(person)) {
        currentConsecutiveNights[person] = 0;
      }
      if (!item.dayShift.includes(person)) {
        currentConsecutiveDays[person] = 0;
      }
    }
  }

  for (const person of PERSONNEL) {
    stats[person].totalHours = (stats[person].totalDayShifts + stats[person].totalNightShifts) * SHIFT_HOURS;
    stats[person].weeklyHours = weeklyShiftCounts[person].map((count) => count * SHIFT_HOURS);
    stats[person].maxWeeklyDays = Math.max(0, ...weeklyShiftCounts[person]);
  }

  return stats;
}
