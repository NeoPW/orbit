# Design

## Context

`sortOpenTasks` (`src/features/tasks/domain/tasks.ts`) orders a project's open tasks by due date and age, next steps first; `listOpenTasksOfProject` applies it. `tasks` has no order column. Other lists (goals, measures, areas) have an integer `sort_order` that is only assigned at creation. Rows sync last-write-wins per row, so an order spread over many rows can merge badly when two devices reorder.

## Goals / Non-Goals

**Goals:** a move writes one row; nothing changes for projects that were never reordered; the order syncs.

**Non-Goals:** ordering outside a project's list; collaborative merge of simultaneous reorders beyond last write wins.

## Decisions

### A nullable `tasks.sort_order` (REAL), fractional positions
`sort_order` is null until the user reorders. The first move writes positions 0, 1, 2 … to the project's open tasks in their displayed order (a few rows, once), then every later move writes only the moved task: the midpoint between its new neighbours, or the first or last position ± 1 at the ends. Alternatives: an integer position rewritten for all tasks on every move (many rows per move, worse merges), or a separate order table (a new synced table for one list). Rejected for cost and complexity.

### Order rule: positions first, then the old order
`sortOpenTasks` sorts next steps first, then tasks with a position by position, then tasks without one by due date and age. This keeps never-reordered projects exactly as they are and puts new tasks after the manual ones without a write at creation time. The sort stays a pure function and gets the new tests.

### Home tie-break by slots
`sortByRank` keeps its comparator (rank, date, creation) unchanged, and a second pass reorders within runs of tasks tied on rank and date: the tasks of one project that have a position are put in position order, in the places those tasks already occupy; everything else stays where the comparator put it. Putting the position into the comparator would not be transitive across projects (a cycle between two same-project tasks and a third task by creation), and would reshuffle cross-project ties for users who never reordered. The slot pass keeps the old order exactly for projects without positions.

### Renormalise when the gap is too small
If the midpoint between two neighbours is closer than 1e-6 to either, the project's positions are rewritten as 0, 1, 2 … in order, in one batch (`db.batch`). Rare in practice.

### Group rules
Moves are within next steps or within the other tasks. The target position is computed against the group's neighbours only, so a drop across the boundary lands at the end of the nearer group. Marking a task as a next step gives it a position after the last next step when the list is manual (so it ends at the end of that group), and unmarking after the last other task; with no manual order nothing is written.

### Reset and project changes
"Reset order" sets `sort_order` to null on the project's open tasks in one batch. `updateTask` clears `sort_order` when the project or goal assignment changes, so a task never carries a position into another list.

### Drag with pointer events
The handle uses pointer events with pointer capture rather than HTML5 drag and drop, which behaves unevenly in the desktop webview (WebKitGTK). The dragged row follows the pointer, the other rows make room, and the drop reads the final index. The handle is a button with `aria-label` "Move task"; `Alt+↑` and `Alt+↓` call the same move. No package is added.

### Migration
Generated with `npm run db:generate` and `npm run db:generate:server` (a new file, no existing migration touched). The column is nullable, so existing rows need no backfill, and an older app syncing with a newer server (or the reverse) keeps working: an unknown column is ignored on one side and null on the other.

## Risks / Trade-offs

- [Two devices reorder the same project before syncing: per-row last write wins, so the merged order can look odd] → acceptable for a single user; the list is always valid and "Reset order" restores a clean state.
- [A task that is reopened keeps its old position among current tasks] → it returns to its old place, or after the others when it had none.
- [Dragging a row inside `AnimatedList` may fight its enter and leave animations] → the list stays animated for completion; drag state is local to the row and cleared on drop.
