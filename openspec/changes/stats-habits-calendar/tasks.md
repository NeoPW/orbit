# Tasks

## 1. Habit streaks

- [x] 1.1 Add `src/features/habits/domain/streaks.ts`: `habitStreak` (current and best, in days or weeks) and `habitDayStates` (checked / missed / neutral per day).
  - Verify: `streaks.test.ts` covers "Today still open", "Missed day", "Days not due are skipped", "Check on a day not due", "Weekly target", "Best longer than current", "New habit" (habits spec) and "Missed day", "Before creation", "Weekly habit" (calendar states).

## 2. Work calendar and heatmap logic

- [x] 2.1 Add `src/features/stats/domain/work-calendar.ts`: `dailyMinutes`, `intensity` (four steps by share of the busiest day), `calendarRange` (calendar year of a period, 53 weeks for all time) and `weekdayHourMinutes` (entries spread over hours with `blockTimes`, across midnight, local time).
  - Verify: `work-calendar.test.ts` covers "Busiest day", "Period in the year", "All time", "Spread over hours", "No duration" and "Weekdays add up".

## 3. Data

- [x] 3.1 Add the per-habit period figures (check-ins kept / expected over the period's weeks, time logged) to `src/features/stats/domain/habit-stats.ts` and order habits by current streak, then title.
  - Verify: `habit-stats.test.ts` covers "Row" and "Order".
- [x] 3.2 Add `src/features/stats/data/detail-loader.ts` (active habits, all their checks, entries of the calendar range or all) and `src/features/stats/ui/useStatsDetail.ts` on `useLiveQuery`.
  - Verify: a loader test with `openTestDatabase()` checks that entries outside the calendar year are not loaded and that "All time" loads all.

## 4. Screens

- [x] 4.1 Add `src/features/stats/ui/DayCalendar.tsx` (+ CSS): week columns, month labels, a step or state per day, dimmed days outside a range, tooltips.
  - Verify: "Tooltip" checked in the browser.
- [x] 4.2 Add the work calendar panel and the heatmap panel (`src/features/stats/ui/WorkPanels.tsx`, + CSS) below the trends.
  - Verify: "Period in the year", "All time" and "Spread over hours" checked in the browser with the example data.
- [x] 4.3 Add the habits panel (`src/features/stats/ui/HabitsPanel.tsx`, + CSS) with a row per active habit and the toggled habit calendar; add the three panels to `StatsScreen.tsx`.
  - Verify: "Toggle", "No habits" and "Order" checked in the browser.

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md`: §5 "Habits" (streaks) and §6.5a (the new panels; remove them from "Planned next").
- [x] 5.2 Run `npm run check`.
- [x] 5.3 Verify in the browser and in the desktop app: each panel at each period kind, the habit calendar toggle, and the narrow layout (panels stack).
