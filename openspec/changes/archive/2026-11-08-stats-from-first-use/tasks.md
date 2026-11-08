# Tasks

## 1. First-use date

- [x] 1.1 Move `firstDataDate` from `src/features/stats/data/period-loader.ts` to `src/features/review/data/first-use.ts` as `firstUseDate(db)`; update its test (from `period-loader.test.ts`) and the imports.

## 2. Stats

- [x] 2.1 `src/features/stats/domain/period.ts`: rename `allStart` to `firstUse`; `fullRange` cuts the start at `firstUse` for every kind; `periodWeeks` drops weeks whose Monday is before `weekStartOf(firstUse)`; `periodBuckets` drops buckets that end before `firstUse`; add `canStepBack(period, today, firstUse)`. Tests in `period.test.ts`: the "Nothing before first use" scenario, a Friday first-use keeping its week, buckets of a year starting at the first-use month, a period wholly before first use having no days and no weeks.
- [x] 2.2 `src/features/stats/domain/period-stats.ts`: pass `firstUse` through `periodHeadline`, `periodTrend` and `previousHeadline`; `previousHeadline` returns null when the previous period ends before `firstUse`. Tests in `period-stats.test.ts`: "Daily average from first use", "Weeks reviewed from first use", "No trend points before first use", "No comparison with a period before first use".
- [x] 2.3 `src/features/stats/data/period-loader.ts` and `detail-loader.ts`: load `firstUseDate` for every period kind and pass it on (rename the `allStart` fields to `firstUse`, also in the panels under `src/features/stats/ui/`).
- [x] 2.4 `src/features/stats/ui/StatsScreen.tsx`: disable ‹ with `canStepBack`.

## 3. Review

- [x] 3.1 `src/features/review/domain/week-time.ts`: `recentWeeks` takes `firstUse`; weeks before its week get `beforeFirstUse: true` and `average: null`; averages divide by the weeks not before it and are null when there are none (`headline: number | null`). Tests in `week-time.test.ts`: "Weeks before first use", and "Weeks without work" still counting 0.
- [x] 3.2 `src/features/review/data/week-loader.ts` and `domain/week-summary.ts`: load `firstUseDate` and pass it to `recentWeeks`.
- [x] 3.3 `src/features/review/ui/TimeSection.tsx` (and the trend chart there): nothing for a week before first use, no headline value when the average is null.

## 4. Verify

- [ ] 4.1 Desktop app and browser: Stats on the month of first use shows the cut daily average and week count and ‹ disabled; the year view starts its trends at the first-use month; Review's "Recent weeks" shows no bars before the first-use week.
- [x] 4.2 Run `npm run check` once.
