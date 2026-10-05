# Design

## Context

After milestone 3:
- **Schema and reviews:** the schema is version 2 (one step-by-step migration, generated tests in `test/core/db/migrations/`). The `weekly_reviews` table exists unused: `week_start` unique (also across soft-deleted rows), `score` nullable with CHECK 1–10, `reflection`, `plan_next_week`, `completed_at`.
- **Data the summary reads:**
  - log entries carry `occurred_at`
  - tasks carry `completed_at`
  - habit checks carry a local `date`
  - KR progress is computed by `krProgress` (numeric, boolean, habit with check-ins).
- **Reminders:** `planReminders` builds habit and deadline reminders, and `ReminderSync` keeps them scheduled. Settings are key-value rows read into `AppSettings`.
- **Review tab:** still a `PlaceholderScreen`.

See `proposal.md` for motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- Week logic (review week, summary aggregation, adherence, KR change) as pure functions with unit tests.
- One repository for reviews and snapshots that owns drafts, saving and the unique-week rule.
- The second migration follows the path set by the first (make-migrations, generated tests, data test).

**Non-Goals:**
- No statistics beyond one week, no editing of other weeks, no review deletion (proposal, Out of scope).
- The projects and KR steps reuse existing repositories and widgets; no new project or KR editing logic.

## Decisions

### 1. Schema version 3: KR snapshots

New table `ReviewKrSnapshots` (SQL `review_kr_snapshots`) with the shared sync columns, because it is user data that sync will carry like the other entity tables:

| Column | Type | Notes |
|---|---|---|
| `weekly_review_id` | TEXT | indexed |
| `key_result_id` | TEXT | |
| `progress` | REAL | 0–1, as computed by `krProgress` at save time |

No unique constraint, so re-saving can soft-delete the old snapshots of a review and insert new ones without the soft-delete/unique conflict. That conflict exists for `habit_checks` and `weekly_reviews`.

**Migration:** `schemaVersion` 3. `make-migrations` writes `drift_schema_v3.json`, extends `app_database.steps.dart` and the generated tests. The strategy becomes:

```
stepByStep(from1To2: …, from2To3: (m, s) => m.createTable(s.reviewKrSnapshots))
```

A data test migrates a v2 database containing settings and a weekly review to v3 and checks both are unchanged. The existing v1 data test now targets the current version.

*Alternative considered:* a JSON column on `weekly_reviews`. Rejected: it's still a migration, harder to query, and doesn't fit row-level sync.

### 2. Review repository

`ReviewRepository` (`features/review/data/`), built on `Repository`:

- **`watchForWeek(CalendarDate weekStart)`:** the live review of a week, if any.
- **`watchCompleted()`:** completed reviews, newest `week_start` first, for the history and "this week's plan".
- **`watchLatestSnapshotsBefore(CalendarDate weekStart)`:** `Map<krId, progress>`. For each KR, the snapshot from the most recent completed review with `week_start` before the given week. Done in one query, ordering by `week_start`, with the newest per KR picked in Dart.
- **`saveDraft(weekStart, {score, reflection, plan})`:** upserts the week's row. It looks up the row by `week_start` including soft-deleted rows and revives it if needed, as `HabitCheckRepository.check` does. `completed_at` is left as it is: a completed review being edited stays completed until saved again.
- **`complete(weekStart, {score, reflection, plan, snapshots})`:** in one transaction:
  - upsert with `completed_at = now`
  - soft-delete the review's existing snapshots
  - insert one row per `(krId, progress)`.

### 3. Pure week logic (`features/review/domain/`)

| Function | Notes |
|---|---|
| `reviewWeekStart(CalendarDate today)` | `today.weekStart` on Sunday, else `today.weekStart - 7` |
| `workPerProject(entries, projects, weekStart)` | Groups entries with `occurred_at` (local date) in the week. Returns `(projectId?, title, count, minutes)`, ordered by minutes, then count, then title. `projectId == null` means "No project". |
| `habitAdherence(habits, checks, weekStart)` | For active habits. Expected count: `daily` = days from `max(weekStart, created date)` to the week's Sunday; `weekdays` = selected weekdays in that range; `times_per_week` = the target. Habits created after the week are left out. |
| `completedTasksInWeek(tasks, projects, weekStart)` | Done tasks whose local `completed_at` date is in the week, newest first |
| `krProgressChanges(keyResults, objectives, checkIns, previousSnapshots)` | KRs of active objectives with current progress and the change in percentage points (rounded), or null without a snapshot |
| `buildWeekSummary(...)` | Combines the four into a `WeekSummary` |

### 4. Data access for the summary

- **`LogRepository.watchBetween(DateTime from, DateTime to)`:** entries with `occurred_at` in the UTC range of the week's local days, from Monday 00:00 local to the next Monday 00:00 local.
- **`TaskRepository.watchCompletedBetween(from, to)`:** the same range on `completed_at`.
- **Habit checks:** the existing `watchSince`.
- **`KeyResultRepository.setProgressValue(id, double current)`:** for the KR step, it updates only `current_value` (1/0 for boolean) and `updated_at`, so editing a value doesn't go through the full form.

`weekSummaryProvider(CalendarDate weekStart)` in `features/review/data/` combines these streams with `objectivesProvider`, `keyResultsProvider`, `habitCheckInsProvider`, `allProjectsProvider` and `habitsProvider` via `combineAsync`, and calls `buildWeekSummary`. `reviewWeekProvider` derives the review week from `todayProvider`.

### 5. Screens and routes

- **`/review`:** `ReviewScreen`, in order:
  - "This week's plan" card: `plan_next_week` of the newest completed review, or "No plan yet"
  - the start / continue / edit button
  - `WeekSummaryView`
  - a "History" tile.
- **`/review/weekly`:** `WeeklyReviewScreen`, a root-level route like project detail, so the review reminder can open it from any tab. It uses a Material `Stepper` (vertical on phones, horizontal at 600 px and wider) with six steps. Moving between steps and leaving the screen (`PopScope`) call `saveDraft`. Save validates the score and calls `complete`, then returns to Review.
  - **Projects step:** reuses `ProjectRepository.setStatus` through a status menu, and `showTaskDialog(asNextStep: true)` or the project's next-step task title for the next step.
  - **KR step:** a number field for numeric KRs (saved when valid), a switch for boolean KRs, and progress only for habit KRs.
  - **Score step:** `ChoiceChip`s 1–10 and a multiline reflection field.
  - **Plan step:** a multiline field.
- **`/review/history`** and **`/review/history/:id`:** the list and a read-only detail.

### 6. Review reminder

- **`AppSettings`** gains `reviewDay` (ISO weekday, default 7) and `reviewTime` (default 18:00). The keys are `review_day` and `review_time`, in the existing settings table.
- **`planReminders`** gains `completedReviewWeeks` (a set of `week_start`). For each date in the horizon whose weekday is `reviewDay`:
  - the reminder is skipped when `reviewWeekStart(date)` is in that set
  - the title is "Weekly review", the body names the week range
  - the route is `/review/weekly`.
- **`ReminderSync`'s inputs** add the completed reviews.
- **Settings screen:** a "Review day" dropdown (Monday to Sunday) and a "Review time" tile with the 24-hour picker, under a "Weekly review" heading.

### 7. Testing approach

- Unit tests:
  - `reviewWeekStart` (Sunday, Monday, Saturday, across a year)
  - each summary function, covering the week-summary scenarios (outside-week entries, "No project", adherence for all three schedule types and mid-week creation, task dates in local time, KR change and no snapshot)
  - the review reminder in `planReminders` (scheduled, skipped when completed, other review day).
- Repository tests for drafts (create, revive, keep `completed_at`), `complete` with snapshot replacement, `watchCompleted` ordering, latest snapshots before a week, `watchBetween`/`watchCompletedBetween` boundaries and `setProgressValue`.
- Migration tests: the generated v1→v3 and v2→v3 schema tests, plus the v2→v3 data test.
- Widget tests:
  - the Review tab (no plan, plan shown, button labels)
  - the stepper (step order, draft kept after leaving, save without a score blocked, save completes, projects step pause, KR value update)
  - history order and detail
  - the Settings review day and time
  - the app-shell Review destination.

## Risks / Trade-offs

- [The KR change compares with the most recent snapshot before the review week, not exactly "last week"] → It matches how the review is used ("since the last review"). Weeks without a review just widen the comparison window. The label says "since last review".
- [Edits in the projects and KR steps take effect immediately and are not undone by leaving the review] → This is intended: they are ordinary edits, as the specs state.
- [Draft saving on every step change writes often] → Only one row, and only score, reflection and plan.
- [The review week changes at midnight between Sunday and Monday only in its label, since both days point at the same week] → `reviewWeekStart` makes Sunday and Monday agree, so a review started on Sunday evening can be continued on Monday.
- [The second migration runs on the phone with real data] → Generated tests for v1→3 and v2→3, the data test, and a manual upgrade check on the phone (tasks).

## Migration Plan

1. On first start of the new build, drift migrates version 2 (or 1) to 3 by creating `review_kr_snapshots`. No existing rows change.
2. The new settings keys need no migration; missing keys read as defaults (Sunday, 18:00).
3. Rollback: a version 3 database can't be opened by the milestone 3 build. The upgrade is checked on the phone before relying on it.

## Follow-ups for archiving

**`docs/SPEC.md`:**
- §4: add the `ReviewKrSnapshot` entity (`weekly_review_id`, `key_result_id`, `progress`) and the review day and time settings (no longer "later").
- §6.4: the review week rule (Sunday = this week, otherwise the previous week); the Review tab shows the current plan first; drafts; KR change since the previous completed review; the projects and KR steps apply changes immediately.
- §8: the weekly review reminder is skipped when that week's review is completed.
