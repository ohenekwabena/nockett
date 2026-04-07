type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface ScheduleData {
  week: number;
  day: DayOfWeek;
  dayShift: string[];
  nightShift: string[];
}

const PERSONNEL = ["Jesse", "Owusu", "Lawrence", "Baaba", "Kwabena", "Emma", "Ella", "Peter"];
const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WEEKS = 4;
const DAY_SHIFT_MIN = 2; // Minimum 2 on day shift
const DAY_SHIFT_MAX = 3; // Maximum 3 on day shift
const NIGHT_SHIFT_SIZE = 2; // Fixed 2 on night shift
const SHIFT_HOURS = 12;
const MAX_CONSECUTIVE_NIGHTS = 2;
const MAX_MONTHLY_HOURS = 180;
const MAX_SHIFTS_PER_PERSON = Math.floor(MAX_MONTHLY_HOURS / SHIFT_HOURS); // 15
const MAX_DAYS_PER_WEEK = 4;
const TOTAL_DAYS = WEEKS * DAYS.length;
const MAX_ATTEMPTS = 2000;

type PersonCounter = Record<string, number>;
type PersonWeekCounter = Record<string, number[]>;
type PersonWeekSet = Record<string, Set<number>>;

interface SolverState {
  totalShifts: PersonCounter;
  weeklyShifts: PersonWeekCounter;
  consecutiveNights: PersonCounter;
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

export function generateSchedule(seed?: number): ScheduleData[] {
  let lastError = "Unknown failure.";
  let failureDay = -1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const random = makeRandom((seed ?? Date.now()) + attempt * 9973);
    const result = generateAttempt(random);

    if (result.success && result.schedule) {
      return result.schedule;
    }

    lastError = result.error;
    failureDay = result.failureDay;
  }

  const dayInfo =
    failureDay > 0
      ? `\nFailed to fill shifts on day ${failureDay} (Week ${Math.ceil(failureDay / 7)}, ${DAYS[(failureDay - 1) % 7]}).\nLikely cause: Not enough eligible personnel for ${lastError}.`
      : "";

  throw new Error(
    `Unable to generate a valid schedule after ${MAX_ATTEMPTS} attempts.\n` +
      `Constraints: ${DAY_SHIFT_MIN}-${DAY_SHIFT_MAX} day shift + ${NIGHT_SHIFT_SIZE} night shift per day, ` +
      `4 day-team personnel + 4 night-team personnel per week, one pair works 4 days and the other 3 days.\n` +
      `Max consecutive nights: ${MAX_CONSECUTIVE_NIGHTS}, Max hours: ${MAX_MONTHLY_HOURS}h, Max days/week: ${MAX_DAYS_PER_WEEK}.` +
      `${dayInfo}`,
  );
}

function generateAttempt(random: () => number): {
  success: boolean;
  schedule: ScheduleData[] | null;
  error: string;
  failureDay: number;
} {
  const schedule: ScheduleData[] = [];
  const state = createInitialState();
  const weeklyPlans = buildWeeklyTeamPlans(random);

  for (let weekIndex = 0; weekIndex < WEEKS; weekIndex++) {
    const week = weekIndex + 1;
    const plan = weeklyPlans[weekIndex];

    const dayPairPlan = buildPairPlan(plan.dayTeam, week, state, random);
    const nightPairPlan = buildPairPlan(plan.nightTeam, week, state, random);

    const extraDayCandidates = shuffle([...plan.dayTeam], random);
    // Tracks whether the 3-person day shift has already been used this week
    let extraDayUsedThisWeek = false;

    for (let dayOfWeek = 0; dayOfWeek < DAYS.length; dayOfWeek++) {
      const day = DAYS[dayOfWeek];
      const preferredDayPair = dayPairPlan.primaryDays.has(dayOfWeek) ? dayPairPlan.primary : dayPairPlan.secondary;
      const altDayPair = preferredDayPair === dayPairPlan.primary ? dayPairPlan.secondary : dayPairPlan.primary;

      const chosenDayPair = isPairEligible(preferredDayPair, week, state, false)
        ? preferredDayPair
        : isPairEligible(altDayPair, week, state, false)
          ? altDayPair
          : null;

      if (!chosenDayPair) {
        return {
          success: false,
          schedule: null,
          error: "day shift pair eligibility exhausted",
          failureDay: weekIndex * DAYS.length + dayOfWeek + 1,
        };
      }

      const dayShift = [...chosenDayPair];

      // Extra person: only Mon/Tue/Wed (indices 0-2) and only once per week
      const isEarlyWeekDay = dayOfWeek <= 2;
      if (!extraDayUsedThisWeek && isEarlyWeekDay && random() < 0.5) {
        for (const extra of extraDayCandidates) {
          if (dayShift.includes(extra)) {
            continue;
          }

          if (!isPersonEligible(extra, week, state, false)) {
            continue;
          }

          dayShift.push(extra);
          extraDayUsedThisWeek = true;
          break;
        }
      }

      const preferredNightPair = nightPairPlan.primaryDays.has(dayOfWeek)
        ? nightPairPlan.primary
        : nightPairPlan.secondary;
      const altNightPair =
        preferredNightPair === nightPairPlan.primary ? nightPairPlan.secondary : nightPairPlan.primary;

      let chosenNightPair: string[] | null = null;
      if (isPairEligible(preferredNightPair, week, state, true)) {
        chosenNightPair = preferredNightPair;
      } else if (isPairEligible(altNightPair, week, state, true)) {
        chosenNightPair = altNightPair;
      }

      if (!chosenNightPair) {
        return {
          success: false,
          schedule: null,
          error: "night shift pair eligibility exhausted",
          failureDay: weekIndex * DAYS.length + dayOfWeek + 1,
        };
      }

      const nightShift = [...chosenNightPair];

      applyShift(dayShift, week, state, false);
      applyShift(nightShift, week, state, true);

      for (const person of PERSONNEL) {
        if (!nightShift.includes(person)) {
          state.consecutiveNights[person] = 0;
        }
      }

      schedule.push({
        week,
        day,
        dayShift,
        nightShift,
      });
    }
  }

  if (validateSchedule(schedule)) {
    return { success: true, schedule, error: "", failureDay: -1 };
  }

  return {
    success: false,
    schedule: null,
    error: "validation (one or more constraints violated)",
    failureDay: -1,
  };
}

function buildWeeklyTeamPlans(random: () => number): WeekTeamPlan[] {
  const base = shuffle([...PERSONNEL], random);
  const plans: WeekTeamPlan[] = [];

  for (let weekIndex = 0; weekIndex < WEEKS; weekIndex++) {
    const start = (weekIndex * 2) % base.length;
    const dayTeam = [
      base[start],
      base[(start + 1) % base.length],
      base[(start + 2) % base.length],
      base[(start + 3) % base.length],
    ];

    const daySet = new Set(dayTeam);
    const nightTeam = base.filter((person) => !daySet.has(person));

    plans.push({ dayTeam, nightTeam });
  }

  return plans;
}

function buildPairPlan(team: string[], week: number, state: SolverState, random: () => number): PairPlan {
  const ordered = [...team].sort((a, b) => state.totalShifts[a] - state.totalShifts[b]);
  const pair1 = [ordered[0], ordered[1]];
  const pair2 = [ordered[2], ordered[3]];

  const score1 =
    state.totalShifts[pair1[0]] +
    state.totalShifts[pair1[1]] +
    state.weeklyShifts[pair1[0]][week - 1] +
    state.weeklyShifts[pair1[1]][week - 1];
  const score2 =
    state.totalShifts[pair2[0]] +
    state.totalShifts[pair2[1]] +
    state.weeklyShifts[pair2[0]][week - 1] +
    state.weeklyShifts[pair2[1]][week - 1];

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

function isPersonEligible(person: string, week: number, state: SolverState, isNight: boolean): boolean {
  if (state.totalShifts[person] >= MAX_SHIFTS_PER_PERSON) {
    return false;
  }

  if (state.weeklyShifts[person][week - 1] >= MAX_DAYS_PER_WEEK) {
    return false;
  }

  if (isNight && state.consecutiveNights[person] >= MAX_CONSECUTIVE_NIGHTS) {
    return false;
  }

  return true;
}

function isPairEligible(pair: string[], week: number, state: SolverState, isNight: boolean): boolean {
  return pair.every((person) => isPersonEligible(person, week, state, isNight));
}

function applyShift(people: string[], week: number, state: SolverState, isNight: boolean): void {
  for (const person of people) {
    state.totalShifts[person] += 1;
    state.weeklyShifts[person][week - 1] += 1;

    if (isNight) {
      state.consecutiveNights[person] += 1;
    } else {
      state.consecutiveNights[person] = 0;
    }
  }
}

function validateSchedule(schedule: ScheduleData[]): boolean {
  const weeklyDayPersonnel: Record<number, Set<string>> = {};
  const weeklyNightPersonnel: Record<number, Set<string>> = {};
  const personShiftCounts: Record<string, number> = {};
  const personDaysPerWeek: Record<string, number[]> = {};
  const personConsecutiveNights: Record<string, number> = {};

  for (const person of PERSONNEL) {
    personShiftCounts[person] = 0;
    personDaysPerWeek[person] = Array(WEEKS).fill(0);
    personConsecutiveNights[person] = 0;
  }

  for (let week = 1; week <= WEEKS; week++) {
    weeklyDayPersonnel[week] = new Set<string>();
    weeklyNightPersonnel[week] = new Set<string>();
  }

  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const entry = schedule[dayIndex];

    if (entry.dayShift.length < DAY_SHIFT_MIN || entry.dayShift.length > DAY_SHIFT_MAX) {
      return false;
    }

    if (entry.nightShift.length !== NIGHT_SHIFT_SIZE) {
      return false;
    }

    if (entry.dayShift.some((person) => entry.nightShift.includes(person))) {
      return false;
    }

    // Update consecutive nights tracker
    for (const person of PERSONNEL) {
      if (entry.nightShift.includes(person)) {
        personConsecutiveNights[person] += 1;
      } else {
        personConsecutiveNights[person] = 0;
      }

      // Check consecutive nights constraint
      if (personConsecutiveNights[person] > MAX_CONSECUTIVE_NIGHTS) {
        return false;
      }
    }

    for (const person of entry.dayShift) {
      personShiftCounts[person] += 1;
      personDaysPerWeek[person][entry.week - 1] += 1;
      weeklyDayPersonnel[entry.week].add(person);
    }

    for (const person of entry.nightShift) {
      personShiftCounts[person] += 1;
      personDaysPerWeek[person][entry.week - 1] += 1;
      weeklyNightPersonnel[entry.week].add(person);
    }
  }

  for (let week = 1; week <= WEEKS; week++) {
    if (weeklyDayPersonnel[week].size !== 4) {
      return false;
    }

    if (weeklyNightPersonnel[week].size !== 4) {
      return false;
    }

    for (const person of weeklyDayPersonnel[week]) {
      if (weeklyNightPersonnel[week].has(person)) {
        return false;
      }
    }

    const weekEntries = schedule.filter((item) => item.week === week);
    if (weekEntries.length !== DAYS.length) {
      return false;
    }

    const dayPairCount = countPairOccurrences(weekEntries.map((entry) => entry.dayShift));
    const nightPairCount = countPairOccurrences(weekEntries.map((entry) => entry.nightShift));

    if (dayPairCount < 4) {
      return false;
    }

    if (nightPairCount < 4) {
      return false;
    }

    // 3-person day shifts must only happen once per week and only Mon-Wed (indices 0-2)
    let tripleCount = 0;
    for (const entry of weekEntries) {
      if (entry.dayShift.length === DAY_SHIFT_MAX) {
        tripleCount += 1;
        const dayIndex = DAYS.indexOf(entry.day);
        if (dayIndex > 2) {
          return false; // Triple only allowed Mon/Tue/Wed
        }
      }
    }
    if (tripleCount > 1) {
      return false; // At most one triple per week
    }
  }

  for (const person of PERSONNEL) {
    if (personShiftCounts[person] > MAX_SHIFTS_PER_PERSON) {
      return false;
    }

    for (let w = 0; w < WEEKS; w++) {
      if (personDaysPerWeek[person][w] > MAX_DAYS_PER_WEEK) {
        return false;
      }
    }
  }

  return true;
}

function createInitialState(): SolverState {
  const totalShifts: PersonCounter = {};
  const weeklyShifts: PersonWeekCounter = {};
  const consecutiveNights: PersonCounter = {};

  for (const person of PERSONNEL) {
    totalShifts[person] = 0;
    weeklyShifts[person] = [0, 0, 0, 0];
    consecutiveNights[person] = 0;
  }

  return {
    totalShifts,
    weeklyShifts,
    consecutiveNights,
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

export function formatScheduleForDisplay(schedule: ScheduleData[]): {
  [week: number]: { [day: string]: { dayShift: string[]; nightShift: string[] } };
} {
  const formatted: { [week: number]: { [day: string]: { dayShift: string[]; nightShift: string[] } } } = {};

  for (const item of schedule) {
    if (!formatted[item.week]) {
      formatted[item.week] = {};
    }

    formatted[item.week][item.day] = {
      dayShift: item.dayShift,
      nightShift: item.nightShift,
    };
  }

  return formatted;
}

export function getScheduleStats(schedule: ScheduleData[]): {
  [personnel: string]: {
    totalDayShifts: number;
    totalNightShifts: number;
    totalHours: number;
    weeksWithDayShift: number;
    weeksWithNightShift: number;
    maxConsecutiveNights: number;
    maxWeeklyDays: number;
  };
} {
  const stats: {
    [personnel: string]: {
      totalDayShifts: number;
      totalNightShifts: number;
      totalHours: number;
      weeksWithDayShift: number;
      weeksWithNightShift: number;
      maxConsecutiveNights: number;
      maxWeeklyDays: number;
    };
  } = {};

  const currentConsecutiveNights: PersonCounter = {};
  const currentWeeklyDays: PersonWeekCounter = {};
  const weeksWithDay = createWeekSet();
  const weeksWithNight = createWeekSet();

  for (const person of PERSONNEL) {
    stats[person] = {
      totalDayShifts: 0,
      totalNightShifts: 0,
      totalHours: 0,
      weeksWithDayShift: 0,
      weeksWithNightShift: 0,
      maxConsecutiveNights: 0,
      maxWeeklyDays: 0,
    };
    currentConsecutiveNights[person] = 0;
    currentWeeklyDays[person] = [0, 0, 0, 0];
  }

  for (const item of schedule) {
    for (const person of item.dayShift) {
      stats[person].totalDayShifts += 1;
      weeksWithDay[person].add(item.week);
      currentWeeklyDays[person][item.week - 1] += 1;
      currentConsecutiveNights[person] = 0;
    }

    for (const person of item.nightShift) {
      stats[person].totalNightShifts += 1;
      weeksWithNight[person].add(item.week);
      currentWeeklyDays[person][item.week - 1] += 1;
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
    }
  }

  for (const person of PERSONNEL) {
    stats[person].weeksWithDayShift = weeksWithDay[person].size;
    stats[person].weeksWithNightShift = weeksWithNight[person].size;
    stats[person].totalHours = (stats[person].totalDayShifts + stats[person].totalNightShifts) * SHIFT_HOURS;
    stats[person].maxWeeklyDays = Math.max(...currentWeeklyDays[person]);
  }

  return stats;
}

function createWeekSet(): PersonWeekSet {
  const weeks: PersonWeekSet = {};

  for (const person of PERSONNEL) {
    weeks[person] = new Set<number>();
  }

  return weeks;
}
