# Tasks

## 1. Shared progress at a moment

- [x] 1.1 Move `measureAt` from `src/features/review/domain/week-summary.ts` into `src/features/goals/domain/goals.ts` as an exported `measureStateAt` and use it there.
  - Verify: `npx vitest run src/features/review src/features/goals` passes unchanged.

## 2. Domain

- [x] 2.1 Add `src/features/stats/domain/goal-stats.ts`: goal progress at the end of a date, the goals listed for a period, the change in points, the series per bucket and the projection (`complete`, `early`, `stalled` or a date with the days against the deadline).
  - Verify: `goal-stats.test.ts` covers "Change in the period", "No change", "Goal without measures", "Not started yet", "Points of a quarter", "Progress at a past date", "Habit measure", "Ahead of the deadline", "Behind the deadline", "No deadline", "Too early", "No progress" and "Complete".

## 3. Data

- [x] 3.1 Extend `src/features/stats/data/detail-loader.ts` with the active goals, their measures, recorded changes and habit check dates.
  - Verify: the loader test checks that a measure comes with its changes and that completed and deleted goals are left out.

## 4. Panel

- [x] 4.1 Add `src/features/stats/ui/GoalsPanel.tsx` (+ CSS): a row per goal with colour, title, progress, change, a small progress chart and the projection text; opening a row opens the goal. Place it before the tasks panel in `StatsScreen.tsx`.
  - Verify: "Change in the period", "Goal without measures", "No goals", "Ahead of the deadline", "Behind the deadline" and "Complete" checked in the browser with the example data.

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md` §6.5a (the goals panel; drop "Planned next") and the milestone note.
- [x] 5.2 Run `npm run check`.
- [x] 5.3 Verify in the browser and in the desktop app: the panel at each period kind, a goal with a deadline and one without, and the narrow layout.
