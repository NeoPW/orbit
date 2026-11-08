# Proposal

## Why

Stats and the Review's "Recent weeks" treat the time before the user started using Orbit as weeks with no work. In the month Orbit was first used the daily average is divided by days nobody tracked, "N of M weeks reviewed" counts weeks without the app, trends start with zero points, comparisons are made against empty periods, and the 4-week average in Review is pulled down by weeks of 0 h (SPEC §6 Stats and Review; openspec stats, week-summary). "All time" already starts at the first data; the other periods and Review do not.

## What Changes

- The **first-use date** is the date "All time" already starts at: the earliest log entry, habit check or completed review. It is now known for every period, not only for "All time".
- **Stats:** every period is cut at the first-use date.
  - The daily average counts days from the first-use date.
  - A period's weeks start with the week that contains the first-use date, so reviewed-week counts and habit adherence skip earlier weeks.
  - Trends have no point for weeks or months that end before the first-use date.
  - The comparison shows no change when the previous period ends before the first-use date, and uses its cut figures when the first-use date falls inside it.
  - ‹ is disabled on the period that contains the first-use date.
- **Review, "Recent weeks":** weeks before the week of first use show no bar and no average point, and the 4-week average is taken over the weeks from the week of first use on. Without such a week there is no average.
- Without any data there is no first-use date and nothing is cut (the empty state shows as today).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stats`: new requirement "Periods start at first use"; "Periods" (‹ disabled on the first-use period) and "All time" (named as the first-use date) change.
- `week-summary`: "Recent weeks" leaves out weeks before first use.

## Impact

- `src/features/stats/domain/period.ts`, `period-stats.ts`, `data/period-loader.ts`, `data/detail-loader.ts`, `ui/StatsScreen.tsx`; `src/features/review/domain/week-time.ts`, `week-summary.ts`, `data/week-loader.ts`, `ui/TimeSection.tsx`; their tests.
- No schema, sync or migration changes. SPEC §6 Stats/Review do not describe this level of detail; no SPEC update needed.
- Out of scope: a user-set start date in Settings; the work calendar and heatmap grids (they still show the whole month, with empty days before first use); the week summary of a single week (Review's week switcher, daily average of the week).
