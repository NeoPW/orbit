# Tasks

## 1. Figures

- [x] 1.1 Add the habits figure (check-ins counted up to what each habit expects, out of all expected) and the done counts (tasks, projects) to the summary in `src/features/review/domain/week-summary.ts` / `week-time.ts`.
  - Verify: tests for "Habits kept" and "Done" in `week-time.test.ts`; existing figure tests keep passing.

## 2. Dashboard

- [x] 2.1 Split `src/features/review/ui/WeekSummaryView.tsx` (and `TimeSection.tsx`) into panels: figures row, goals, time by, recent weeks, days, habits and done this week. Arrange them in a 12-column grid from 1100 px content width with the spans of "Dashboard layout", stacked below. Optional `plan` and `history` slots go in their places.
  - Verify: "Wide window" and "Narrow window" checked in the browser at 1300 and 900 px.
- [x] 2.2 List only measures that changed during the week under each goal in the goals panel.
  - Verify: the "Unchanged measure" test in `week-summary.test.ts` (or the view) covers it; checked in the browser.
- [x] 2.3 Show the seven day timelines in the Days panel across the full width (`WeekTimeline` with the hours in each day's heading and a scroll height), replacing the strip and its popup. Put habits, done this week and the history in three equal columns (two without the history).
  - Verify: the scenarios of "Work by day" and "Wide window", checked in the browser.
- [x] 2.4 Give panels side by side the same height, whatever their content (`WeekSummaryView.module.css`).
  - Verify: "Same height in a row" at 1440 px in the browser.

## 3. Review tab, history page and flow

- [x] 3.1 Rebuild `src/features/review/ui/ReviewScreen.tsx`:
  - header with the title, the week switcher and the review button (tooltip names the review week)
  - the dashboard with the plan panel and the history panel (latest 5, "Show all")
  - Remove the page's 800 px cap.
  - Verify: "No review yet", "Plan shown", "Completed week", "Button in the header", "Current week on a Monday" and "Show all" checked in the browser; "Fits a maximised window" at 1440 × 900.
- [x] 3.2 Use the dashboard on a past review's page (`ReviewHistoryPage.tsx`, below the reflection, plan and notes) and in step 1 of the guided review (`ReviewFlow.tsx`, wide enough for the grid on that step).
  - Verify: both pages checked in the browser.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md` §6.5 (the dashboard, the figures, the days strip, the history panel, the review button in the header).
- [x] 4.2 Run `npm run check`.
- [x] 4.3 Verify in the browser and in the desktop app (maximised window): the dashboard, the days popup and `Esc`, and the narrow layout.
