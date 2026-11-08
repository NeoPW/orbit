# Proposal

## Why

The Stats tab shows totals and trends, but not the two things that make long-term tracking motivating: how long a habit has been kept without a break, and what a year of work looks like at a glance. Habit streaks were called a must when stats were planned; the work calendar and the weekday × hour heatmap show when work actually happens. See docs/SPEC.md §5 "Habits" and §6.5a "Stats"; this is the second of the stats changes after `stats-tab`.

## What Changes

- **Habit streaks** as derived logic: the current and best streak of each habit, counted in days for daily and weekdays habits and in weeks for times-per-week habits. Days a habit is not due are skipped, and today does not break a streak until it is over.
- A **Habits panel** on the Stats tab: every active habit with its current and best streak, check-ins kept out of expected in the shown period, and the time logged on it in the period. Choosing a habit shows its **calendar** (checked, missed and not-due days).
- A **work calendar** panel: a full-year grid of days shaded by hours worked, with the shown period emphasised.
- A **weekday × hour heatmap** panel: when work happens in the shown period, from the log entries' start and end times.

**Out of scope:** streaks anywhere else in the app (Home, Plan); adherence by weekday; a date a habit was switched off (inactive habits are simply not listed); custom date ranges; the phone; the remaining stats changes (`stats-time-tasks`, `stats-goals`).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `habits`: habit streaks (current and best).
- `stats`: the Stats tab shows the new panels; Habits panel, habit calendar, work calendar and work heatmap.

## Impact

- `src/features/habits/domain/` (streaks) and `src/features/stats/` (domain, data loader, UI panels); `StatsScreen.tsx` lays out the panels.
- Reuses `blockTimes` from `src/features/timeline/domain/day-timeline.ts`, `weekAdherence` and the period helpers from `stats-tab`.
- No schema change, no new package; calendar and heatmap are plain HTML/CSS grids.
- `docs/SPEC.md` §5 and §6.5a updated.
