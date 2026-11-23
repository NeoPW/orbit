# Proposal

## Why

Importance × urgency decides the order of Home's To do, the active projects and the Plan tab, so the lists keep moving on their own and cannot be arranged the way the user works through them (feedback: "remove importance completely, order just by time added and drag and drop"). Importance is also one more field to fill in on every task and project.

## What Changes

- **BREAKING** Importance is removed from tasks and projects everywhere: task and project forms, the importance dots (task rows on Home, task page and popup, project detail, Plan), the review's projects step and the phone's quick-add. The task rank, the project score and project urgency are removed (docs/SPEC.md §3, §4 Project/Task, §5 "Project score" and "Task rank", §6.1, §6.2, §6.3, §6.5, §6.7).
- A project's open task list is ordered by time added (oldest first) instead of by due date, until the user drags it; "Reset order" goes back to time added. Next steps still come first.
- Home's To do gets its own manual order: listed by time added until the user drags, then dragged tasks by their Home position and the rest after them; new tasks and newly marked next steps go to the end. Reordering works by dragging a handle or `Alt+↑`/`Alt+↓` on the focused handle, like a project's list, and syncs.
- The tasks behind Home's "Show N more" toggle follow the project order and each project's task order.
- Active projects on Home and projects in Plan are ordered by effective deadline (earliest first, none last), then time added (oldest first).

Out of scope:
- Dropping the `importance` columns from the database (kept unused, see design.md).
- Manual ordering of projects, or of the tasks behind "Show N more".
- "Reset order" for Home's To do.
- `#` project autocomplete and other New task / quick-add changes (change `faster-task-entry`).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `tasks`: task importance removed; task page and popup without importance; project task order by time added; Reset order returns to time added.
- `home`: task rank, project score and project urgency removed; To do in a manual order with drag and keys; "Show N more" order; projects by deadline then time added; New task without importance.
- `projects`: create a project without importance.
- `project-detail`: header without importance dots.
- `plan-overview`: project entries without importance, ordered by deadline then time added.
- `weekly-review`: projects step without importance.
- `visual-design`: no importance dots in the metadata rule.
- `mobile-layout`: quick-add without importance.

## Impact

- Schema: new nullable `home_position` column on `tasks`, one migration in `drizzle/`, server migration via `npm run db:generate:server`. `importance` columns on `tasks` and `projects` stay but are no longer read or written.
- Domain: `src/features/tasks/domain/tasks.ts` (rank, importance, `applyProjectOrder` removed; new Home order), `src/features/projects/domain/projects.ts` (score, urgency removed; new project order).
- Data: `src/features/home/data/home-queries.ts`, `src/features/tasks/data/tasks-repository.ts`, `src/features/projects/data/projects-repository.ts`.
- UI: `TaskSheet`, `TaskDetails`, `TaskRow`, `ProjectSheet`, `ProjectPage`, `ProjectRow`, `ProjectTasksSection`, review `ProjectsStep`, `HomeScreen`, Plan sections, `ImportanceDots` (deleted), component gallery, example data; callers that pass `importance: null` (`CommandPalette`, `FocusPanel`, review `next-step.ts`).
- docs/SPEC.md needs updating (importance, score, rank, Home ordering).
- The Purpose of the `projects` spec (mentions importance) and of the `home` spec ("in order of score") need a direct edit at archive.
