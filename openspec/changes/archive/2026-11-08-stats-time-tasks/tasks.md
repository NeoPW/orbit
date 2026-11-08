# Tasks

## 1. Shared grouping

- [x] 1.1 Extract `groupTime(entries, rows)` (total, minutes on goals, by area, goal and project) from `weekTime` in `src/features/review/domain/week-time.ts` and use it there; change `TimeByPanel` in `src/features/review/ui/TimeSection.tsx` to take only the three lists.
  - Verify: `npx vitest run src/features/review` passes unchanged; the Review tab's "Time by" still renders the same in the browser.

## 2. Domain

- [x] 2.1 Add `src/features/stats/domain/period-time.ts`: the period's grouped time (by local date within the period range) and the project rows (time in the period, time in total from the grouped lifetime sums, days from creation to completion), ordered by period time.
  - Verify: `period-time.test.ts` covers "By project over a quarter", "Month boundary", "Other", "Long project", "Finished project" and "Order".
- [x] 2.2 Add `src/features/stats/domain/task-stats.ts`: completed and created counts, the median time to done, and the completed-per-bucket trend.
  - Verify: `task-stats.test.ts` covers "Completed and created", "Median", "Even count", "Under a day", "No completed task" and "Chart of a quarter".

## 3. Data

- [x] 3.1 Extend `src/features/stats/data/detail-loader.ts`: entry links, the link rows (areas, goals, projects, tasks, habits), the tasks' dates and the lifetime minutes per project (grouped in SQL).
  - Verify: the loader test checks that lifetime sums include entries outside the calendar year and that deleted tasks are excluded.

## 4. Panels

- [x] 4.1 Add the time-by panel and the projects panel (`src/features/stats/ui/TimePanels.tsx`, + CSS), using `TimeByPanel`; opening a project row navigates to it.
  - Verify: "By project over a quarter", "Long project", "Finished project" and "No project time" checked in the browser with the example data.
- [x] 4.2 Add the tasks panel (`src/features/stats/ui/TasksPanel.tsx`, + CSS) with the three figures and a `TrendChart`; lay all new panels out in `StatsScreen.tsx` (time by and projects side by side from 1100 px, tasks below, habits last).
  - Verify: "Completed and created", "Under a day", "No completed task" and "Chart of a quarter" checked in the browser.

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md` §6.5a (the three panels; "Planned next" keeps only goals).
- [x] 5.2 Run `npm run check`.
- [x] 5.3 Verify in the browser and in the desktop app: each panel at each period kind and the narrow layout; the Review tab's "Time by" is unchanged.
