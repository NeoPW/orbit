# Design

## Context

The review groups a week's time by area, goal and project inside `weekTime` (`src/features/review/domain/week-time.ts`), with entry-to-project, area and goal attribution in the loop. Stats needs the same grouping over a period, so the attribution must not be written twice. The detail loader from `stats-habits-calendar` already loads the log entries of the calendar year (all for "All time"), but only a few of their columns and none of the links.

## Goals / Non-Goals

**Goals:** one attribution rule for the week summary and for Stats; project totals that do not depend on the shown period; no schema change.

**Non-Goals:** comparing with the previous period; showing task figures per project.

## Decisions

### Extract the grouping from `weekTime`
A pure `groupTime(entries, rows)` in `week-time.ts` returns the total, the minutes on goals and the three `TimeItem` lists; `weekTime` calls it for the week's entries and Stats calls it for the period's. Behaviour of the week summary does not change; its existing tests are the check. Alternative: copy the loop into Stats. Rejected: the attribution rule (project directly, through the task or the habit; area through the project; goals via `isWorkOnGoal`) would drift.

### Reuse the "Time by" panel
`TimeByPanel` in `TimeSection.tsx` takes only `byArea`, `byGoal` and `byProject`, so Stats passes its own lists. Bars, colours, links and the switch are shared.

### Extend the detail loader instead of adding a loader
`loadStatsDetail` also returns the entries' `projectId`, `goalId` and `taskId`, the rows needed for links (areas, goals, projects with area, goal, colour, created and completed dates; tasks with project, goal, created and completed dates; habits with project and goal), and the lifetime minutes per project: all entries grouped by `projectId`, `taskId` and `habitId` with a sum in SQL, attributed to projects in the domain code. This keeps one live query for the lower panels and avoids loading every entry just for totals.

### Tasks measured by date
Completed and created are counted by the local date of `completedAt` and `createdAt`; deleted tasks are excluded and reopened tasks (status open) are not counted as completed. Time to done is the difference of the two instants; the median of an even count is the mean of the middle two.

## Risks / Trade-offs

- [A task reopened and completed again has its latest completion date] → accepted; only the latest completion exists in the data.
- [Time to done includes tasks that sat open as a backlog] → that is what the figure means; it is a median, so a few old tasks do not dominate.
- [A deleted project's time falls under "Other" in the project grouping] → same as the week summary.
