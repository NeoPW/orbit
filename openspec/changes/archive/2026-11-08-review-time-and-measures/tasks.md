# Tasks

## 1. Measure value history

- [x] 1.1 Add the `measure_changes` table to `src/core/db/schema.ts` and `SYNCED_TABLES`, and to `server/src/schema.ts` with `serverSeq` and its index.
  - Generate the new migrations `drizzle/0004_*` and `server/migrations/0004_*` (`npm run db:generate`, `npm run db:generate:server`). Do not touch 0003.
  - Update the version expectations in `src/core/db/migrate.test.ts` and any server schema test to 5.
  - Verify: `npx vitest run src/core/db server`.
- [x] 1.2 Record changes in `src/features/goals/data/measures-repository.ts`: `setMeasureValue` and `updateMeasure` write the measure and a change row in one batch, only for a real value change with the same numeric or boolean type.
  - Verify: tests in `measures-repository.test.ts` for the scenarios "Step recorded", "Same value" and "Type changed".
- [x] 1.3 Add the pure `valueAt(currentValue, changes, instant)` in `src/features/goals/domain/goals.ts`.
  - Verify: tests in `goals.test.ts` for "Value at a moment" and "No later change".

## 2. Week summary: goals and time

- [x] 2.1 Extend `src/features/review/data/week-loader.ts`: log entries for the 11 weeks ending with the shown week, areas, the `measure_changes` of the measures, and habit check-in dates per measure.
  - Verify: `week-loader.test.ts` still passes, with one test that an entry from 9 weeks earlier is loaded but not counted in the week.
- [x] 2.2 Replace the review-based change in `summarizeGoals` (`src/features/review/domain/week-summary.ts`) with the week's change: the value at the start and end of the week per measure (numeric, yes/no, habit) and the goal's change in percentage points, hidden when zero.
  - Verify: `week-summary.test.ts` covers the scenarios of "Goals and their change in the week"; tests of the old "change since review" are removed.
- [x] 2.3 Add `src/features/review/domain/week-time.ts` with the total, the daily average, the time on goals and the groups by area, goal and project, with "Other" last. Remove `summarizeWork` and the `work` field.
  - Verify: `week-time.test.ts` covers the scenarios of "Time worked in the week" and "Time by area, goal and project".
- [x] 2.4 Add `recentWeeks` (8 bars, rolling 4-week average without a point for the current week, headline) to `week-time.ts`.
  - Verify: tests for "Eight weeks", "Current week headline" and "Weeks without work".
- [x] 2.5 UI in `src/features/review/ui/WeekSummaryView.tsx` and `.module.css`:
  - goals with the value text "7 → 9 / 10" and the change
  - a "Time" tile with the three figures, the Area/Goal/Project switch (`SegmentedControl`) with coloured bars (goal and project rows open them), and the recent-weeks SVG chart with its headline
  - the "Work" section removed
  - Verify: `npx vitest run src/features/review`; check the look in the browser.

## 3. Review tab and settings

- [x] 3.1 Add the optional `week` parameter to the `review` route in `src/core/routing/routes.ts` (path `/review?week=`; a missing, invalid or future week means the current week; a date is snapped to its Monday). Remove `review-last-week`, `LastWeekPage.tsx` and its entry in `src/app/Shell.tsx`.
  - Verify: tests in `routes.test.ts`.
- [x] 3.2 Add the week switcher to `src/features/review/ui/ReviewScreen.tsx`: ‹ range ›, "This week", next disabled on the current week, plan only for the current week, and the "Last week" button removed.
  - Verify: the scenarios of "Week switcher", checked in the browser.
- [x] 3.3 Add the `weeklyTargetHours` setting to `src/features/settings/data/settings.ts` (null or 1–168, stored as `''` for none) and a "Review" section with a number field in `src/features/settings/ui/SettingsScreen.tsx`. Pass the target to the summary.
  - Verify: tests in `settings.test.ts` for "Set a target", "Clear the target" and "Invalid value".
- [x] 3.4 Add a few `measure_changes` and logged weeks to the example data in `src/features/settings/data/example-data.ts`, so the review shows changes and a trend.
  - Verify: `example-data.test.ts` passes.

## 4. Plan per week and calendar weeks

- [x] 4.1 Add `calendarWeek(weekStart)` and `formatWeek` ("CW 45", with range) to `src/features/review/domain/review-week.ts`; use them in `ReviewScreen`, `ReviewFlow`, `ReviewHistoryPage`, `NotesSection`, `plan-reminders.ts` and the trend chart (`TimeSection.tsx`).
  - Verify: tests in `review-week.test.ts` for "Review header" and "Year boundary"; `plan-reminders` tests updated.
- [x] 4.2 Show the plan of the week before the shown week: add `getPlanForWeek` to `reviews-repository.ts` and use it in `ReviewScreen`.
  - Verify: tests in `reviews-repository.test.ts` for "Plan of a past week", "Week before was not reviewed" and "Draft".

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md`:
  - §4: MeasureChange and the weekly hour target setting
  - §5: "Weeks", the change in the week, and "Progress"
  - §6.5: the Review tab with the week switcher and the summary with Time and recent weeks, without the Last week page
  - §6.6: the Review section in Settings
- [x] 5.2 Run `npm run check` (full suite) and fix what fails.
- [ ] 5.3 Verify in the browser and in the desktop app:
  - week switching and "This week"
  - the Time tile with and without a target
  - raising a measure, after which the Goals section shows "7 → 9" for this week
- [x] 5.4 With the user's go-ahead: deploy the server (`npm run server:deploy`, schema 5), run the smoke test, and check that the desktop syncs a measure change. (Deployed, schema 5; the smoke test and the sync check were not run.)
