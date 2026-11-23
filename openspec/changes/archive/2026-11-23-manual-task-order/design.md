# Design

## Context

See proposal.md for the motivation. Today:
- `projects.importance` (integer, not null, default 3) and `tasks.importance` (nullable) feed `projectScore`/`compareByScore` and `taskRank`/`compareByRank` (`src/features/projects/domain/projects.ts`, `src/features/tasks/domain/tasks.ts`). Home's To do is ranked, with `applyProjectOrder` as a tie-break by the project's manual order.
- A project's manual task order lives in `tasks.sort_order` (real, nullable), maintained by `moveTask`, `setNextStep` and `resetTaskOrder` in `tasks-repository.ts` with the `positionBetween`/`positionTooClose` helpers. `TaskList` in `TaskRow.tsx` already renders drag handles and `Alt+↑/↓` through `onMove`.
- Sync is last-write-wins per row over all columns; the phone may run an older build for a while.

## Goals / Non-Goals

**Goals:**
- One manual order for Home's To do, stored per task, synced like any other column.
- Reuse the project reorder machinery for Home instead of a second implementation.

**Non-Goals:**
- Removing the `importance` columns or rewriting existing rows.
- Ordering habits or projects by hand.

## Decisions

### Keep the `importance` columns, stop using them
The columns stay in `schema.ts` (marked deprecated in a comment) and in D1; no code reads or writes them, so new projects get the default 3 and new tasks null. 
- *Why:* an older phone build still selects and pushes `importance`; dropping the column would make its pushes fail on the server and its pulls lose the field. Keeping it costs nothing.
- *Alternative:* drop the columns in a migration once every device runs the new build. Possible later as a separate cleanup; not needed now.

### New `tasks.home_position` column (real, nullable)
Same shape and semantics as `sort_order`: null until To do is first reordered; fractional so a move usually writes one row.
- *Why a separate column:* the Home order must be independent of the project's list (spec scenario "Independent of the project order"); reusing `sort_order` would make one drag move the task in both lists.
- *Alternative:* a separate `home_order` table with one row per task — more sync surface and joins for no gain.
- Migration: `npm run db:generate` (new `drizzle/0009_*.sql`, `ALTER TABLE tasks ADD home_position real`), then `npm run db:generate:server`. Applied migrations are not touched.

### Home order rules in the domain
New pure functions in `src/features/tasks/domain/tasks.ts`:
- `sortTodo(tasks)`: positioned tasks by `homePosition`, then the rest by `createdAt` (oldest first). New tasks have null, so they land at the end without any write.
- The base project order in `sortOpenTasks` changes from due date + creation to creation only.
- `compareProjects`: effective deadline (none last), then `createdAt`; replaces `compareByScore` and the Plan comparator.
- Removed: `effectiveImportance`, `taskRank`, `rankDate`, `compareByRank`, `applyProjectOrder`, `urgency`, `projectScore`.

### Home reorder in the repository
`moveTodoTask(db, clock, id, toIndex)` in `tasks-repository.ts` mirrors `moveTask`: load the current To do list (same query Home uses), first move writes positions 0…n-1 for the whole list in one `db.batch()`, later moves write only the moved task via `positionBetween`, and renumber when `positionTooClose`. The position-writing helper is generalized over the column (`sortOrder` or `homePosition`) instead of copied.
`setNextStep(…, true)` additionally sets `homePosition = max + 1` of the To do list when To do has a manual order, in the same batch.
Stale positions of tasks that left To do (e.g. paused project) are kept; when they come back they return to their old place. Acceptable and simpler than clearing positions on every status change.

### Home UI
Home's To do rows get the drag handle via the same `onMove` mechanism `TaskList` uses; the "Show N more" rows are rendered without it. Importance dots are removed from all rows; `ImportanceDots.tsx` is deleted with its gallery entry.

## Risks / Trade-offs

- [Concurrent reorders on two devices] → last write wins per row; the worst case is a slightly different order, which the user fixes with one drag.
- [Users lose the automatic "overdue first" push in To do] → intended; deadline badges stay red/amber so overdue tasks remain visible.
- [Dead `importance` columns confuse later readers] → comment in `schema.ts`; docs/SPEC.md entity list updated to say the field is unused.

## Migration Plan

1. Ship the migration with the app; existing To do starts in time-added order (all `home_position` null).
2. Regenerate and deploy the server migration before or with the app release, so pushes with `home_position` are accepted.
3. Rollback: older builds ignore `home_position`; nothing to undo.
