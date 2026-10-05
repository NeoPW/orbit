# Proposal

## Why

The app records work, habits and tasks, but there is no moment to step back: the Review tab is still a placeholder. Milestone 4 (`docs/SPEC.md` §9, §6.4) adds the weekly review: see last week at a glance, walk through projects and key results, score the week, reflect and plan the next one. It also adds the weekly review reminder that was moved here from milestone 3 (SPEC §8).

## What Changes

- **Review week.** On Sunday a review covers the week ending today (Monday–Sunday); on Monday to Saturday it covers the previous Monday–Sunday. One review per week (`week_start` stays unique).
- **Review tab** (SPEC §6.4) replaces the placeholder, top to bottom:
  - the plan for this week from the latest completed review
  - a button to start the review of the review week, or to continue or edit it if one exists
  - the summary of the review week
  - a link to the history.
- **Week summary** (SPEC §6.4 "Default view", step 1 of the flow):
  - work logged per project (count and total duration)
  - habit adherence per active habit (done vs. expected in that week)
  - tasks completed that week
  - KR progress of active objectives, with the change since the previous completed review.
- **Guided weekly review** (SPEC §6.4):
  1. Look back: the week summary.
  2. Projects: each active project with its next step. Status can be changed and a next step set or changed, applied immediately.
  3. Key results: update the values of numeric and boolean KRs, applied immediately.
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save: sets `completed_at` and stores a progress snapshot of every KR of an active objective.

  Score, reflection and plan are saved as a draft on every step, so a review can be left and continued.
- **History:** completed reviews, newest first, with week, score and plan. Tapping one shows it in full.
- **Weekly review reminder** (SPEC §8):
  - fires on the review day and time from Settings (default Sunday 18:00)
  - not shown when that week's review is already completed
  - tapping it opens the guided review.
- **Settings:** review day and review time.
- **Database schema version 3:** a `review_kr_snapshots` table (synced columns like the other entity tables), added by a drift migration. Existing data is kept.

## Capabilities

### New Capabilities
- `weekly-review`: The review week rule, the Review tab, the guided review flow with drafts, saving with KR snapshots, editing a completed review, the plan display and the history.
- `week-summary`: The at-a-glance summary of a week: work per project, habit adherence, completed tasks and KR progress with change since the previous review.

### Modified Capabilities
- `app-shell`: Review is no longer a placeholder.
- `notifications`: Adds the weekly review reminder; tapping it opens the review.
- `settings`: Adds the review day and time; the Settings screen shows them.
- `local-database`: The schema is version 3 with the KR snapshot table, and upgrades from versions 1 and 2 keep all data.

## Impact

- **Code:**
  - new `lib/features/review/` (data, domain, ui), replacing the placeholder screen
  - extensions to `LogRepository`, `TaskRepository` and `KeyResultRepository` (value updates) for week queries
  - the reminder planner and `ReminderSync`
  - the settings domain and screen
  - new routes for the review flow and history.
- **Data:** schema version 2 → 3 (one new table), with a drift step-by-step migration and a migration test. Review day and time are new keys in the existing settings table, so they need no migration.
- **Dependencies:** none.
- **docs/SPEC.md** updates at archive time:
  - §4 (new `ReviewKrSnapshot` entity, review day/time settings)
  - §6.4 (review week rule, plan at the top of Review, drafts, KR change since the previous review)
  - §8 (review reminder skipped once the review is completed).

## Out of scope

- **Longer-term statistics** (score trends, time per area or project, habit streaks). SPEC §6.4 marks these as "later".
- **Reviewing weeks other than the current review week.** Older weeks are only viewed in the history, not created or edited.
- **A full KR value history.** Only snapshots at review time are stored.
- **Deleting reviews.**
- **Showing the week plan on Home.**
