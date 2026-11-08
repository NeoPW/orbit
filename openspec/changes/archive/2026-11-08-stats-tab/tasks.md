# Tasks

## 1. Periods

- [x] 1.1 Add `src/features/stats/domain/period.ts`: period kinds, parse/format of the address value (`2026-11`, `2026-Q4`, `2026`, `all`, invalid or future → current month), labels, step, the date range (current period capped at today, "all" from a given start date), the containing period of another kind, and the buckets (weeks by Thursday for month/quarter, months for year/all).
  - Verify: `period.test.ts` covers "Step back", "No future periods", "Switch kind", "Invalid address", "Week across two months" (week assignment), "Quarter" (13 weeks) and "Year" (buckets up to the current month).

## 2. Figures

- [x] 2.1 Move the expected/kept count of one habit in one week out of `summarizeHabits` (`src/features/review/domain/week-summary.ts`) into an exported function in `src/features/habits/domain/habits.ts`, and use it from the week summary.
  - Verify: `npx vitest run src/features/review/domain src/features/habits/domain`; existing "Habit adherence" tests pass unchanged.
- [x] 2.2 Add `src/features/stats/domain/period-stats.ts`: per-week figures (minutes, minutes on goals via `isWorkOnGoal`, habit kept/expected, review score), the headline of a period (time worked, daily average, average score with reviewed/total weeks, habit adherence, share on goals), the comparison with the previous period, and the trend points per bucket ("so far" marker, no point for later buckets or missing values).
  - Verify: `period-stats.test.ts` covers "Time across two months", "Daily average of the current month", "Daily average of a past month", "Average", "No review", "Two weeks", "Share on goals", "Better than last month", "No previous value", "Week without a review" and "Start of all time".

## 3. Data

- [x] 3.1 Add `src/features/stats/data/period-loader.ts` (rows for the shown and previous period, earliest log entry / habit check / completed review for "All time") and `src/features/stats/ui/usePeriodStats.ts` on `useLiveQuery`.
  - Verify: a loader test with `openTestDatabase()` checks that entries just outside the range are not loaded and that the earliest date is found.

## 4. Navigation

- [x] 4.1 Add the `stats` route with `?period=` and the `stats` section in `src/core/routing/routes.ts`; the Stats entry (icon, after Review) in `src/app/Sidebar.tsx`; the screen in `src/app/Shell.tsx`.
  - Verify: `routes.test.ts` covers `/stats`, `/stats?period=2026-Q3` and the section; "Stats address" and "Wide window" checked in the browser.
- [x] 4.2 In `src/app/shortcuts/keys.ts` (and the overlay list) bind `Shift+S` → Stats and move Settings to `Ctrl+,`; update the Settings tooltip/hint in `src/app/Sidebar.tsx`. Add the "Stats" go-to entry in `src/features/palette/entries.ts`.
  - Verify: `keys.test.ts` and `entries.test.ts` cover "Stats", "Settings" and the new entry.

## 5. Stats screen

- [x] 5.1 Add `src/features/stats/ui/StatsScreen.tsx` (+ CSS module): header with the title and the period picker (kind switch, ‹ ›, label), the headline figures with their changes, and the empty state.
  - Verify: "Open Stats", "Empty period", "Live update" and "Reload" checked in the browser.
- [x] 5.2 Add `src/features/stats/ui/TrendChart.tsx`: plain SVG points and a line broken at missing values, the "so far" marker, axis labels by week or month; four charts in a 2 × 2 grid below the figures (one column below 1100 px).
  - Verify: "Quarter", "Year" and "Week without a review" checked in the browser with the example data.

## 6. Docs and verification

- [x] 6.1 Update `docs/SPEC.md`: a Stats section (§6) with the periods, figures and trends, Stats in the navigation, the shortcuts in §6.7 (`Shift+S` Stats, `Ctrl+,` Settings), and milestone 7 noting that stats started with this change.
- [x] 6.2 Run `npm run check`.
- [x] 6.3 Verify in the browser and in the desktop app: each period kind, stepping, reload, `Shift+S` and `Ctrl+,`, the palette entry, and that the phone layout has no Stats entry.
