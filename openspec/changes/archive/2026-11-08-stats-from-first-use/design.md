# Design

## Context

`firstDataDate(db)` in `stats/data/period-loader.ts` gives the start of "All time", and `period.ts` already takes an `allStart` argument in `periodRange`, `periodDays`, `periodWeeks` and `periodBuckets`. Every Stats figure and panel goes through those functions, but `allStart` is only loaded for "All time" and only used by `fullRange` for that kind. Review's `recentWeeks` (`review/domain/week-time.ts`) knows nothing about it.

## Decisions

**One first-use date, loaded for every period.** `firstDataDate` moves to `src/features/review/data/first-use.ts` as `firstUseDate(db)` (stats already imports from review; review must not import from stats). Both stats loaders call it for every period kind; the week loader calls it too. It is three `min()` queries, cheap enough to run on each load.

**Cut in `period.ts`, not in each figure.** `allStart` is renamed `firstUse` and applied to every kind in `fullRange`: `start = max(periodStart, firstUse)`. Everything built on it (days, time, tasks, goals, habits panel, trends) follows without further changes. A period wholly before first use gets `start > end`: zero days, no weeks, no buckets, which shows the empty state.

**Weeks start with the week of first use.** `periodWeeks` keeps the Thursday rule for the period's own bounds but drops weeks whose Monday is before `weekStartOf(firstUse)`. So when Orbit was first used on a Friday, that week still counts (otherwise its review would be lost). This also fixes "All time", which today drops the first week when the first data comes after its Thursday.

**Buckets.** `periodBuckets` drops weeks and months that end before `firstUse`. The months of a year view therefore start at the month of first use.

**Comparison.** `previousHeadline` gets `firstUse` and returns null when the previous period ends before it.

**‹.** New `canStepBack(period, today, firstUse)`: false when the previous period ends before `firstUse`. With no first-use date, ‹ works as today.

**Recent weeks.** `recentWeeks(rows, shownWeek, currentWeek, firstUse)`: a week whose Monday is before `weekStartOf(firstUse)` gets `beforeFirstUse: true` and `average: null`; the rolling and headline averages divide by the weeks of the 4 that are not before first use, and are null when none are. `TrendChart` draws nothing for such a week; the headline shows nothing when null.

## Risks

- Data entered for dates before real use (a log entry back-dated a year) moves the first-use date back. Acceptable: the date then reflects the data, as "All time" already does.
