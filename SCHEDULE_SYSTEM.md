# Personnel Schedule Generator

## Overview
Automated shift scheduling for 8 personnel working 12-hour day/night rotations, anchored to a real calendar month (Monday-aligned weeks; the first week may be partial and the last week runs past month-end to its closing Sunday — e.g. July 2026 spans Wed 1st July to Sun 2nd August across 5 week blocks).

## Personnel
- Jesse, Owusu, Lawrence, Kwabena, Peter, Florence, Emmanuel, Emmanuella

## Shift Times
- **Day Shift**: 7am - 7pm (2 people; 3 people every Wednesday)
- **Night Shift**: 7pm - 7am (always 2 people)

## Constraints
1. **No more than 2 consecutive night shifts**
2. **No more than 3 consecutive day shifts**
3. **No day shift straight after a night shift** — a night ends 7am and the day shift starts 7am the same morning, so the transition would mean zero rest
4. **Wednesday staffing** — exactly 3 on the day shift on Wednesdays, exactly 2 every other day
5. **Max 4 working days per person per week**
6. **Shift cap pro-rated to the window** — the 180h/28-day baseline scales with the number of scheduled days (`maxShiftsForDays`), since 24/7 cover for 8 people over a 31+ day month cannot fit under a flat 180h
7. **Stable pairs** — each week splits the 4-person day team and 4-person night team into two pairs that alternate across the week

## Files
- `src/lib/schedule-service.ts` — month layout (`buildMonthWeeks`), solver (`generateMonthSchedule`), stats (`getScheduleStats`), manual edits (`applyShiftOverrides`)
- `src/lib/schedule-export.ts` — Excel export in the published-roster layout (`buildRotaWorkbook` + `exportRotaToExcel`)
- `src/app/schedules/page.tsx` — schedule page (month navigation, editable grid, download)

## Behaviour

### Generation
Constraint-satisfaction with retries: weekly team plans → pair plans with day patterns → per-day assignment → full validation. Deterministic for a given `(year, month, seed)`; the page seeds each month with `defaultRotaSeed` and Regenerate rerolls the seed.

### Manual edits (admin only)
Admins click any cell in the rota grid to cycle Off → Day → Night → Off. Edits are stored as overrides on top of the generated rota (`applyShiftOverrides`), marked with a dot in the grid, and feed directly into the per-person stats — total hours and hours-per-week update live. "Reset edits" restores the generated rota; Regenerate and month changes clear edits.

### Download
The Download button builds an .xlsx matching the published paper roster exactly: "July, 2026" title; per-week blocks with a bold ordinal date row (`1st July` … `2nd August`), a navy weekday band, a merged `WEEK n` label, and DAY (7am - 7pm) / NIGHT (7pm - 7am) rows with names joined by " / ". The export reflects manual edits, not just the generated rota.

### Stats
Per person: total day/night shifts, total hours vs the pro-rated cap, hours per rota week, max consecutive nights, max days in any week — plus per-person and global constraint pass/fail.

## Tests
- `src/lib/schedule-service.test.ts` — month layout across start-days (Wed/Sat/Sun/Mon), solver validity, determinism, stats, overrides
- `src/lib/schedule-export.test.ts` — workbook structure matches the roster layout

## Future Enhancements
- Save schedules (and manual edits) to the database
- Email notifications for personnel about their schedule
- Preference/availability and vacation handling
