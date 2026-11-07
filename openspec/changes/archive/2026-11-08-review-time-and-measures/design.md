# Design

## Context

- A measure stores only `current_value`. Review snapshots store a measure's progress (0–1), and only when a review is saved.
- The week summary is computed from plain rows: `loadWeekRows` collects them and the pure `summarizeWeek` in `review/domain/week-summary.ts` builds the summary.
- Migrations are tracked only by count (`PRAGMA user_version`, `SCHEMA_VERSION` = number of journal entries, now 4). The sync server rejects clients with another schema version.

## Decisions

### 1. Table `measure_changes` (synced)

| column | type | notes |
|---|---|---|
| shared columns | | `id`, `created_at` (the time of the change), `updated_at`, `deleted_at` |
| `measure_id` | text, not null | |
| `from_value` | real, nullable | value before; null when the measure had none |
| `to_value` | real, not null | value after |

- **Migrations:**
  - The app gets `drizzle/0004_*` (`npm run db:generate`) and the server gets `server/migrations/0004_*` (`npm run db:generate:server`). `SCHEMA_VERSION` becomes 5.
  - These are new migrations: 0003 is not touched.
- **Sync:**
  - Add the table to `SYNCED_TABLES` and to `server/src/schema.ts`, with `serverSeq` and its index like the other tables.
  - Rows are only ever inserted, so last-write-wins has nothing to resolve.
- **Considered:** storing only the new value and deriving the old one from the previous row. Rejected because storing the old value too means no back-fill is needed. The value at moment `t` is `from_value` of the first change with `created_at >= t`, or `current_value` when there is none. So the first recorded change already tells what the value was before the history existed.
- **Considered:** taking a weekly snapshot of values on Monday. Rejected because it needs a background job and misses weeks when the app was not opened.

### 2. Writing the history

- `setMeasureValue` and `updateMeasure` in `measures-repository.ts` read the measure first. They write the measure update and the change row in one `db.batch()`, and only when the type stays numeric or boolean and the value really differs.
- `stepMeasure` and `setMeasureDone` already go through `setMeasureValue`. The review's goals step uses the same functions, so every path is covered.
- **Rapid presses:** pressing + three times records three rows; they are not merged. The rows are small, and the value-at-moment rule gives the right answer anyway.

### 3. Values at a moment (pure, `goals/domain`)

- `valueAt(currentValue, changes, instant)` returns the value at `instant`. It is tested with the scenarios of "Value history".
- Habit measures need no history. Their check-ins up to a moment are counted from `habit_checks` by date, from the goal's start date:
  - at the week's start: dates before Monday
  - at the week's end: dates up to Sunday
- **Progress at the start and end of the week:** `measureProgress` with the measure's current start and target and the value at that moment. The goal's change is `round(goalProgress(end)) − round(goalProgress(start))`.
- The goal list and the progress bars still follow "Goal progress of a week": snapshots for a reviewed week, current progress otherwise. Only the change and the value text come from the history.
  - So on a reviewed week, the snapshot bar and the end-of-week value can differ when values were changed after Sunday, for example in a review done on Monday. A change counts in the week it was made. This is accepted and kept simple.

### 4. Time aggregation (pure, `review/domain/week-time.ts`)

- `weekTime(entries, links, week, today, target)` returns the total, the daily average, the time on goals, and the groups by area, by goal and by project.
- **Links:**
  - The project of an entry is `entry.projectId`, falling back to the task's current project. Habit entries carry their habit's project from the time of logging.
  - The area is the project's `areaId`.
  - Goals reuse `isWorkOnGoal` from `work-log/domain`.
  - For goals the groups are not exclusive (an entry counts for one goal in practice), so "Other" is the total minus all goal time, floored at 0.
- `recentWeeks(totalsByWeek, shownWeek, currentWeek)` returns the 8 bars, the 4-week average points (none for the current week) and the headline.
- **Loading:** `loadWeekRows` loads log entries for the 11 weeks ending with the shown week (8 bars plus 3 earlier weeks for the first averages) instead of only the shown week. It also loads areas and the `measure_changes` of the shown week's measures. The single-week filters stay in the domain, which already ignores entries outside the week.

### 5. Week switcher and route

- The `review` route gets an optional `week` (`/review?week=2026-10-26`), parsed like `review-flow`'s `step`.
  - A missing, invalid or future week means the current week. A date that is not a Monday is snapped to its week's Monday.
  - The sidebar and Shift+R navigate to `{ name: 'review' }`, so they always show the current week.
- The `review-last-week` route and `LastWeekPage.tsx` are removed. `/review/last-week` then falls through to the existing not-found handling.
- The switcher sits in the `PageHeader` actions: an icon button (‹), the range, an icon button (›) and a "This week" button.

### 6. Weekly hour target setting

- `Settings.weeklyTargetHours: number | null`, storage key `weekly_target_hours`. An empty string is stored for none.
- `decode` maps `''` to `null`. `isValidSetting` accepts `null` or a whole number from 1 to 168.
- It is shown in a new "Review" section of the Settings screen as a number field with "h", where an empty field means no target.

### 7. Charts

- The charts are hand-written SVG and CSS bars inside a `Tile`, using the theme tokens and project, goal and area colours. No chart package is added.
- The recent-weeks chart uses one neutral bar colour, highlights the shown week with the accent colour, and draws the 4-week line in the text colour.
- Values are labelled directly. The day timelines stay as they are.

## Risks / Trade-offs

- **Schema version 5:**
  - Every device must update before it can sync again: the desktop app, the browser build served by the server, and the phone APK.
  - The server must be deployed with the migration first. Deploying it is part of the verification task and needs the user's go-ahead.
- **History starts empty:** past weeks show no measure changes. This is stated in the spec.
- **Loading cost:** loading 11 weeks of log entries on every summary is a few hundred rows for a single user, which is acceptable. Live updates re-run the whole loader, as today.
