# Design

## Context

The review computes one week at a time (`summarizeWeek`, `weekTime` in `src/features/review/domain/`), loading rows for that week plus ten weeks of log entries. Stats needs the same figures over up to all data, bucketed by week or month, and for two periods at once (shown and previous). There is no chart library; the review's recent-weeks chart is hand-written SVG.

## Goals / Non-Goals

**Goals:** pure, tested period and bucket logic; one loader per period; the same numbers as the review for any single week.

**Non-Goals:** caching or precomputed aggregates; a chart library; a schema change.

## Decisions

### Period model as a pure module
`src/features/stats/domain/period.ts`: a `Period` (`{ kind: 'month' | 'quarter' | 'year' | 'all', key }`) with parse/format of the address value, label, step, date range, the containing period of another kind, and its buckets (weeks by Thursday for month/quarter, months for year/all). "All" gets its start date from the loader. Alternative: date-fns style helpers spread over the UI. Rejected: the rules (Thursday, current period, no future) need tests in one place.

### Figures computed per week, then aggregated
`src/features/stats/domain/period-stats.ts` computes for each week touched by the shown and previous periods: minutes, minutes on goals, habit kept/expected, review score. A bucket or period then sums weeks (score, habits: weeks by Thursday) or sums entries by local date (time, goal share). Daily average and comparisons are derived from these totals. Alternative: call `summarizeWeek` per week. Rejected: it also builds goals, tasks and time-by-project for every week, which all time does not need.

### Share the habit expectation with the review
The expected/kept count of one habit in one week moves out of `summarizeHabits` into an exported function in `src/features/habits/domain/` and is used by both the week summary and stats, so a week shows the same adherence in both places. The goal-work test uses the existing `isWorkOnGoal` from `work-log`.

### One loader for a period
`src/features/stats/data/period-loader.ts` loads, for the range from the start of the previous period's first week to the end of the shown period's last week: log entries (by UTC range, as the week loader does) and habit checks (by local date); plus all habits, completed reviews, projects and tasks (for goal links). The earliest log entry, habit check and completed review come from three `min()` queries, used for "All time". Hooked up through `useLiveQuery` like `useWeekSummary`, so it updates live.

### Charts in plain SVG
A small `TrendChart` component in `src/features/stats/ui/` draws points and a line that breaks at null values, with a "so far" marker. No new package.

### Route
`{ name: 'stats'; period?: string }` with `?period=` like the review's `?week=`; `sectionOf` returns a new `'stats'` section.

## Risks / Trade-offs

- [Habits have no deactivation date, so only currently active habits count, as in the week summary; deactivating a habit changes the adherence of past periods] → accepted for now; `stats-habits-calendar` can add a deactivation date if it matters.
- [All time loads every log entry into memory] → a few thousand rows a year is small; revisit only if it gets slow.
- [A week's trend point shows the whole week, so the weekly points of a month do not add up to the month's total] → stated in the spec; the headline uses exact dates.
