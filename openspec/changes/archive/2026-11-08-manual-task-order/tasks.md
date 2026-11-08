# Tasks

## 1. Order logic

- [x] 1.1 Extend `sortOpenTasks` in `src/features/tasks/domain/tasks.ts` with the manual position (next steps first, then positioned tasks by position, then the rest by due date and age) and add the pure position helpers: the position for a move between two neighbours, the end-of-group positions and the renormalisation.
  - Verify: `tasks.test.ts` covers "Order" and "New task after a manual order", and the helpers (between two neighbours, at the ends, gap too small).

- [x] 1.2 Add the Home tie-break to `sortByRank` in `src/features/tasks/domain/tasks.ts` (the slot pass of the design); the Home loader passes the positions through.
  - Verify: `tasks.test.ts` covers "Project order breaks a tie", "Rank still wins" and "Other projects keep their places", and the existing rank tests pass unchanged.

## 2. Storage

- [x] 2.1 Add the nullable `sort_order` real column to `tasks` in `src/core/db/schema.ts`; generate the app and the server migrations (`npm run db:generate`, `npm run db:generate:server`).
  - Verify: the new migration files exist and `npm run typecheck` passes; no existing migration changed.
- [x] 2.2 In `src/features/tasks/data/tasks-repository.ts`: `moveTask` (first move assigns positions to the project's open tasks, later moves write one row, renormalise when needed), `resetTaskOrder`, positions for marking and unmarking next steps on a manual list, and clearing `sort_order` in `updateTask` when the assignment changes; `listOpenTasksOfProject` uses the new order.
  - Verify: `tasks-repository.test.ts` covers "Drag a task up", "Next steps stay on top", "Mark as next step", "Reset" and "Move to another project".

## 3. Interface

- [x] 3.1 Add the handle and the drag to `TaskList` / `TaskRow` (`src/features/tasks/ui/TaskRow.tsx`, + CSS): pointer-event drag within the group, `Alt+↑` / `Alt+↓` on the focused handle, focus kept after a move; only the project list passes the move callback.
  - Verify: "Drag a task up", "Keyboard" and "Next steps stay on top" checked in the browser and in the desktop app.
- [x] 3.2 Add "Reset order" (shown only for a manual order) and wire the move to `ProjectTasksSection.tsx`.
  - Verify: "Handles and reset" and "Reset" checked in the browser.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md`: §4 Task (`sort_order`), §5 Task rank (the tie-break) and §6.2 (reordering instead of "deferred").
- [x] 4.2 Run `npm run check`.
- [x] 4.3 Verify in the browser and in the desktop app: drag, keyboard move, next-step groups, reset, reload, the order on the project cards and the tie-break on Home.
