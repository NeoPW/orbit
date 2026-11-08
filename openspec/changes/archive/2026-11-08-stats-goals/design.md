# Design

## Context

`summarizeGoals` in `src/features/review/domain/week-summary.ts` already rebuilds a measure's value and progress at the start and end of a week (`measureAt`, private there): numeric and yes/no measures through `valueAt` over the recorded `measure_changes`, habit measures through their check dates. Stats needs the same at many dates. The detail loader already returns all habit checks; it does not return goals or measures.

## Goals / Non-Goals

**Goals:** one implementation of "progress of a measure at a moment" for the review and for Stats; pure, tested projection logic; no schema change.

**Non-Goals:** forecasting from anything but recent pace; storing snapshots of progress.

## Decisions

### Move `measureAt` to the goals domain
`measureStateAt(measure, instant, lastDate)` joins `valueAt` in `src/features/goals/domain/goals.ts` and the week summary calls it; its tests are the check that nothing changes. A goal's progress at the end of a date is `goalProgress` over its measures' progress at the local midnight after that date, with habit check-ins counted up to that date.

### Stats logic in `goal-stats.ts`
`src/features/stats/domain/goal-stats.ts` returns one row per goal: progress at the period's end, change in points, the series of progress at the end of each bucket (`periodBuckets`) and the projection. The projection is a small discriminated result (`complete`, `early`, `stalled` or a date with the days against the deadline) so the view only formats it. Alternative: compute the projection in the view. Rejected: the window and rounding rules need tests.

### Pace window
28 days up to the end of the period (today for the current one), shortened to the days since the goal's start date; under 7 days is "too early". A fixed window keeps the projection from jumping with the period kind, and a past period shows what the projection was at its end. Alternative: the whole period as the window. Rejected: a year-long window would hide a recent stall.

### Load goals with the detail loader
`loadStatsDetail` also returns the active goals, their measures with recorded changes and check dates (habit checks since the goal's start, as the week loader does). It is the same live query as the other lower panels.

## Risks / Trade-offs

- [Before value changes were recorded, history is flat at the first recorded value, so early progress looks like a jump when the first change is logged] → matches the review; stated in the spec.
- [A numeric measure edited directly to a smaller value shows a drop] → true to the data; the change is signed.
- [The projection is linear and ignores deadlines or seasons] → it says "if the recent pace continued"; nothing more is claimed.
