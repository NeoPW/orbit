# Proposal

## Why

A project's open tasks are ordered by due date, then by age. That cannot express "do this one first" for tasks without due dates, or a plan that differs from the deadlines. docs/SPEC.md §6.2 lists manual reordering as deferred; this change adds it for the open tasks of a project.

## What Changes

- The user can **drag a task** to a new place in a project's open task list, or move it with the keyboard (focus the handle, `Alt+↑` / `Alt+↓`).
- Next steps stay at the top of the list; tasks are reordered **within** their group. Moving a task between the groups is done by marking or unmarking it as a next step, as before.
- Until a project's list is reordered, nothing changes: due date, then age. After the first move the list follows the user's order; **new tasks go after the ordered ones**, by due date among themselves.
- **Reset order** returns the project's list to due-date order.
- Next steps shown elsewhere (project cards on Home and Plan) follow the same order, because they come from the same list.
- On Home the project order is the **tie-break**: among tasks of one project that tie on rank and date, the manual order decides. Rank still comes first, so nothing on Home becomes draggable.
- The order is stored on each task and syncs between devices.

**Out of scope:** dragging on Home's To do list (it stays ranked by task rank; the project order only breaks ties), a "do first" pin, reordering on goal pages, or on the phone; reordering done tasks; moving a task between projects by dragging.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `tasks`: "Open task order" gains the manual order; reordering and resetting.
- `project-detail`: the Tasks section shows the drag handles and "Reset order".
- `home`: "Task rank" uses the project order as the tie-break.

## Impact

- `src/core/db/schema.ts` and a new migration (`tasks.sort_order`, nullable), for the app and for the sync server (`npm run db:generate`, `npm run db:generate:server`).
- `src/features/tasks/domain/tasks.ts` (ordering, the Home tie-break), `src/features/tasks/data/tasks-repository.ts` (move, reset), `src/features/tasks/ui/TaskRow.tsx` (handle, drag), `src/features/projects/ui/ProjectTasksSection.tsx`.
- No new package. `docs/SPEC.md` §4 (Task), §6.2.
