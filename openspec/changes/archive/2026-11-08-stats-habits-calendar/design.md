# Design

## Context

`stats-tab` loads rows for the shown and the previous period (`period-loader.ts`) and computes figures in pure functions. The new panels need data outside that range: every check-in of a habit (the best streak looks at all history) and a whole year of log entries (the calendar), or all entries for "All time". Habits have no deactivation date, and log entries record only `occurredAt`, `durationMinutes` and `source`; `blockTimes` (day-timeline) turns an entry into its start and end.

## Goals / Non-Goals

**Goals:** pure, tested streak, calendar and heatmap logic; the same start/end rule as the day timeline; no schema change.

**Non-Goals:** showing streaks outside Stats; tracking when a habit was switched off; a chart library.

## Decisions

### Streaks as pure functions in the habits domain
`habitStreak(habit, checkDates, today)` and `habitDayStates(habit, checkDates, from, to, today)` in `src/features/habits/domain/streaks.ts`, next to `isDue` and `weekAdherence`. Daily and weekdays walk the days from the creation date to today; times-per-week walks weeks. Today is "pending": an unchecked due today is skipped, not a break. Alternative: store streaks on the habit. Rejected: derived data would need syncing and recomputing on every edit.

### A separate detail loader
`src/features/stats/data/detail-loader.ts` loads the active habits, all their checks and the log entries of the calendar range (the calendar year of the period, the 53 weeks for "All time"; for "All time" the heatmap needs every entry, so it loads them all). A second live query beside `usePeriodStats`, so the headline renders without waiting for the larger load. Alternative: widen the period loader. Rejected: it would make every figure load a year of entries.

### Calendar and heatmap logic in one domain module
`src/features/stats/domain/work-calendar.ts`: `dailyMinutes` (by local date), `intensity` (steps by share of the busiest day) and `weekdayHourMinutes`, which splits each entry between `blockTimes` start and end across hours and across midnight, using local time. Entries without a duration add nothing, matching the timeline.

### Plain grids
One `DayCalendar` component (columns of weeks, seven rows, month labels, a state or step per day) serves the work calendar and the habit calendar; the heatmap is a 7 × 24 CSS grid. No new package.

## Risks / Trade-offs

- [Switching a habit off hides its history; the calendar and streak of an inactive habit are not shown] → accepted, as in `stats-tab`.
- [The creation date, not the first check, starts a habit's streak window, so a habit created today with older imported checks shows a short streak] → acceptable; habits are created in the app.
- [Loading all entries for "All time" grows with use] → a few thousand rows a year; revisit if slow.
