# Proposal

## Why

The Stats tab shows how much work was done and when, but not where it went or what it produced. The review answers "where did the week's time go" for one week only; over a month, quarter or year there is no way to see which areas, goals and projects took the time, what a long project has cost in total, or how many tasks get finished and how quickly. See docs/SPEC.md §6.5a; this is the third of the stats changes, after `stats-tab` and `stats-habits-calendar`.

## What Changes

- **Time by area, goal or project** over the shown period, with the same switch, bars, colours and rules as the week summary (it reuses them).
- A **Projects panel**: projects with their time in the period and their time in total, and for finished projects how many days it took from creation to completion. Long projects show their full cost in every period.
- A **Tasks panel**: tasks completed and created in the period, the median time from creation to completion, and a chart of tasks completed per week or month.

Tasks, not projects, carry the output measure: a long project still finishes tasks every week, so no "projects per month" figure that would make it look like a failure.

**Out of scope:** goal progress and projected finish (`stats-goals`); comparing these figures with the previous period; custom ranges; the phone; time to done by project or by importance.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stats`: the Stats tab shows the new panels; time by area, goal or project over a period, project totals, tasks completed and created, time to done, tasks-done trend.

## Impact

- `src/features/review/domain/week-time.ts` (the grouping is extracted so stats can use it) and `TimeSection.tsx` (the "Time by" panel takes just the three lists); `src/features/stats/` (domain, loader, panels), `StatsScreen.tsx`.
- No schema change, no new package. `docs/SPEC.md` §6.5a updated.
