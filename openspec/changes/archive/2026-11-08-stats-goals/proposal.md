# Proposal

## Why

Goals are what the rest of the app serves, but Stats says nothing about whether they are getting closer: the review shows a goal's change for one week only. Over a month or a year there is no view of how each goal's progress developed, and no answer to "at this pace, will I make the deadline?". This is the last of the planned stats changes after `stats-tab`, `stats-habits-calendar` and `stats-time-tasks`. See docs/SPEC.md §5 "Progress" and §6.5a.

## What Changes

- A **Goals panel** on the Stats tab: every active goal with its progress, its change in the shown period (percentage points), and a small chart of its progress over the period, one point per week or month.
- A **projected finish** per goal: from its recent pace, the date it would reach 100 %, compared with its deadline ("12 days before the deadline", "3 days after").
- Goal progress at any past date is rebuilt from the measures' value history and the habit check-ins, as the week summary already does for week boundaries; that logic is moved to the goals domain so both use it.

**Out of scope:** one combined chart of all goals; projections per measure; editing goals or deadlines from Stats; goals that are completed or archived; the phone.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stats`: the Stats tab shows the Goals panel; goal progress over the period, change, and projected finish.

## Impact

- `src/features/goals/domain/goals.ts` (progress of a measure at a moment) and `src/features/review/domain/week-summary.ts` (uses it); `src/features/stats/` (domain, loader, panel), `StatsScreen.tsx`.
- No schema change, no new package. `docs/SPEC.md` §6.5a updated.
