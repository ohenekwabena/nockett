# Personnel Schedule Generator

## Overview
Built an automated shift scheduling system for 8 personnel working 12-hour day/night rotations over a 4-week cycle.

## Personnel
- Jesse, Owusu, Lawrence, Baaba, Kwabena, Emma, Ella, Peter

## Shift Times
- **Day Shift**: 7am - 7pm
- **Night Shift**: 7pm - 7am

## Constraints
1. **No more than 2 consecutive night shifts** - No person works night shifts on more than 2 consecutive days
2. **At least 1 week of day shifts** - Every person is guaranteed to have at least one full week (7 days) of day shifts
3. **4 per shift** - Each day has exactly 4 people on day shift and 4 on night shift

## Files
- `src/lib/schedule-service.ts` - Core scheduling algorithm and utilities
- `src/components/cards/schedule-viewer-card.tsx` - React component for displaying the schedule
- `src/app/schedules/page.tsx` - Schedule page

## How It Works

### Algorithm
The scheduling system uses a constraint-satisfaction approach:

1. **Distribution Phase**: Pre-assigns each person to specific weeks for day shifts
   - Ensures balanced distribution across all 4 weeks
   - Guarantees every person gets assigned day shifts

2. **Generation Phase**: For each day of the schedule:
   - Assigns 4 staff to day shift based on pre-plan
   - Assigns 4 staff to night shift
   - Respects the 2-consecutive-night constraint

3. **Validation Phase**: Checks if generated schedule meets all constraints
   - Retries up to 10 times with different distributions
   - Returns best valid schedule

## API Reference

### `generateSchedule(): ScheduleData[]`
Generates a complete 4-week shift schedule respecting all constraints.

**Returns**: Array of 28 ScheduleData objects (one per day)

### `formatScheduleForDisplay(schedule: ScheduleData[]): object`
Formats the schedule for easy display in tables/UI.

**Returns**: Object grouped by week and day

### `getScheduleStats(schedule: ScheduleData[]): object`
Calculates statistics for each person:
- Total day shifts
- Total night shifts
- Number of weeks with day shifts
- Maximum consecutive night shifts

## Usage

```typescript
import { generateSchedule, getScheduleStats } from "@/lib/schedule-service";

// Generate schedule
const schedule = generateSchedule();

// Get statistics
const stats = getScheduleStats(schedule);

// View schedule by week/day
const formatted = formatScheduleForDisplay(schedule);
```

## Display Component

The `ScheduleViewerCard` component displays:
- 4-week calendar-style table
- Personnel assigned to each shift
- Regenerate button for new schedules
- Statistics table with constraint compliance indicators
- Constraint information panel

## Types

```typescript
export interface ScheduleData {
  week: number;
  day: DayOfWeek;
  dayShift: string[];
  nightShift: string[];
}
```

## Future Enhancements
- Add ability to save schedules to database
- Add UI to modify or override specific shifts
- Email notifications for personnel about their schedule
- Preference/availability management
- Vacation/time-off handling
