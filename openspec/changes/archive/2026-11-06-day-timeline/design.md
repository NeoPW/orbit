# Design

## Context

Log entries (`log_entries`) already hold what the timeline needs: `occurred_at`, `duration_minutes`, `source` and the links to project, goal and task. A timer entry stores the session's start as `occurred_at`; a manual, task or habit entry stores the moment it was made. The running timer is the single `timers` row. Project and goal colours come from `colors.ts` (`projectColor`, `goalColor`). The review's `WeekSummaryView` is shared by the review screen, the guided look-back step, last week and past reviews. `Select` is a native `<select>`; `Menu` and `popover.ts` already position popups with `position: fixed`, which works inside sheets.

## Goals / Non-Goals

**Goals:**
- One pure layout function decides block times, lanes and the visible hours; both the day view and the week view draw from it.
- No schema change and no change to how entries are written.

**Non-Goals:**
- Editing or planning on the timeline.

## Decisions

### Block times come from the source
- `blockTimes(entry)` (pure, tested): a `timer` entry runs from `occurred_at` for its duration; any other entry with a duration ends at `occurred_at` and starts one duration earlier. This follows what the times mean today (a timer logs its start, everything else is logged after the work).
- An entry without a duration is a dot at `occurred_at`. A block is drawn at least one line of its title high (the minimum in minutes follows from the pixels per hour, so `layoutDay` takes it as a parameter), but keeps its true times in the tooltip.
- Alternative: treat all entries as starting at `occurred_at`. That would plot a 60-minute manual entry logged at 14:30 as 14:30–15:30, in the future.
- The day is the local calendar day: the UTC range of its local midnights is queried (`weekRange` already does this for weeks), then entries are placed by their local time. A block crossing midnight is cut at the day's end.

### Lanes for overlaps
`layoutDay(items, dayStart, dayEnd)` sorts items by start and assigns each to the first lane whose last block has ended (the usual interval-colouring pass), then reports `lane` and `lanes` for each block's overlap group so that widths are `1 / lanes` of the column. Markers do not take a lane.

### Visible hours
The axis is `06:00–22:00`, extended to the whole hours before the earliest and after the latest item of the day. In the week view all seven columns share one axis, extended for the earliest and latest item of any day, so rows line up.

### Data
- `src/features/timeline/data/timeline-loader.ts`: `loadTimeline(db, from, to)` returns plain items `{ id, kind: 'block' | 'marker', start, end, label, note, minutes, color, target }`:
  - entries in the range;
  - the label from the task, else the project, else the goal, else the note;
  - the colour from the task's project (`projectColor`), else the project, else the goal (`goalColor` with its position), else neutral (`null`);
  - `target`: `{ taskId } | { projectId } | { goalId } | null` for opening it;
  - and the running timer, if its start lies in the range, as an item with `running: true` and `end` = now (the UI re-computes `end` each minute).
- The Home tile uses one day; the week summary uses the week's range and groups items by local day.
- Both use `useLiveQuery`, which already reloads after writes and syncs; `useToday()` moves the day at midnight and `useNow(60000)` moves the now line and the running block.

### UI
- `src/features/timeline/ui/DayTimeline.tsx`: one component draws one column (Home) or seven (review) with the same hour grid; blocks are absolutely positioned by minutes (`top = minutes × px per minute`), tinted with `color-mix` of the project colour and a left rail in it. Block content: the title on the first line; the project name and `HH:mm–HH:mm` on a second line when the block is at least two lines high (one line in the narrow week columns, where the tooltip carries the rest). Running blocks use a striped background and are marked with an accessible "running" text.
- Dots: 8 px, in a strip at the column's left edge (blocks start after it), no text; they take no lane and are not stacked. Hover or focus shows the shared tooltip (label, time, note).
- Home: a `Tile` titled "Today" above "Active projects", fixed 12 px per 15 min row (about 48 px per hour, scrollable when the axis is long). Review: a "Days" section in `WeekSummaryView` with the seven columns, 28 px per hour, narrower labels.
- Blocks are `button`s (click opens the item, focus shows the tooltip with note and duration); items without a target are plain.

### Focus defaults
- `Settings.focusMinutes` becomes `number | null` (`null` = open-ended, the default); the stored value is `focus_minutes`, absent or `'none'` meaning open-ended. When reading, 25 becomes 30 and 50 becomes 60 (an older stored value); valid numbers stay 1–1440.
- `useStartFocus` saves the chosen length including `null`. `FocusPanel` and `StartFocusButton` offer 30, 60, 90 and Open-ended.

### Focus quick start
- `src/features/timer/domain/quick-start.ts` (pure, tested):
  - `parseQuickStart(text)` → `{ title, projectQuery | null }`, split at the last `#`, both trimmed.
  - `matchTasks(text, tasks, limit = 8)`: open tasks whose title contains the text, ignoring case; titles starting with it first.
  - `resolveProject(query, projects)`: exact name ignoring case, else the only one starting with it, else `null`.
  - `quickStartPlan(text, tasks, projects)` → `{ kind: 'task', taskId } | { kind: 'new', title, projectId | null } | { kind: 'project', projectId } | { kind: 'error', message } | { kind: 'empty' }`, which the UI only executes.
- Suggestions: all open tasks with their project (a new `listOpenTasks` in `tasks-repository.ts`), the active projects from Home's data. While the text after the last `#` is being typed, the list shows projects; picking one completes `# Name`.
- `QuickStartField.tsx`: an `input` with `role="combobox"`, `aria-autocomplete="list"` and a `listbox` popup in the `Select` popup style (`popover.ts`), arrow keys, Enter (pick, or start when nothing is highlighted), Escape. A new task is created with `createTask`, then the session starts (two writes; a failed start leaves an ordinary open task).

### Habit sessions
- **Schema:** nullable `habit_id` (text) on `timers` and `log_entries` in `src/core/db/schema.ts`; no foreign keys; synced columns follow the schema. Generate with `npm run db:generate` and `npm run db:generate:server` (never edit applied migrations); existing rows keep `null`. Because the sync is last-write-wins per row, an older device that does not know the column ignores it and does not erase it on rows it does not touch.
- `LogTarget` gains `{ habitId }`; a `habitLinks(db, habitId)` returns the habit's project and goal (as `taskLinks` does for tasks). `startTimer` stores `habit_id`; the stop writes the entry with `habit_id`, project and goal of the habit. `checkHabit` also writes `habit_id` on its entry.
- Stop dialog: when the timer has a habit that is not checked today, a checkbox "Mark as done today" (on by default) makes `stopTimer` call `checkHabit` for the stop's local date in the same batch where practical, else right after.
- `timer-view` resolves a habit's title, colour and project like a task's; a deleted habit shows "Deleted habit" and the timer keeps running.
- Quick start: `QuickTask` gains `kind: 'task' | 'habit'`; `matchTasks` works over both; `quickStartPlan` returns `{ kind: 'habit', habitId }` for an exact habit title when no open task has it. Tab in `QuickStartField` picks the highlighted (else first) suggestion without starting.
- Timeline loader: label is task, else habit, else project; colour from the habit's project (else goal); target is the habit's project, else goal, as habits have no page.

### Log work start time
`parseStartTime(text, now)` in `work-log.ts` (pure, tested): empty → none; `HH:mm` today; later than `now` is an error. The entry's `occurredAt` is `now` without a start, else start + duration (start when there is no duration), so `blockTimes` needs no change.

### Done today
`listDoneToday(db, today)` in `home-queries.ts`: tasks with status done whose `completed_at` lies in today's local range (`localRange`), newest first, with project title and colour. The tile reuses `TaskList` rows with a checked checkbox calling `reopenTask`.

### Dropdown
- `Select` keeps its props (`label`, `value`, `onChange`, `options` with groups, `error`) and gets a new optional `color` on options for the dot. It is rebuilt as a `button` (`aria-haspopup="listbox"`, `aria-expanded`) with a `role="listbox"` popup positioned like `Menu` (`popover.ts`, `position: fixed`), roving focus, type-ahead and Escape. Because the API is unchanged, every form's dropdown becomes styled at once.
- Alternative: only restyle the native `<select>` with CSS. The open list stays the browser's and cannot show colour dots, so it does not meet the spec.

## Risks / Trade-offs

- [Manual entries have no start, so their blocks are an assumption] → The spec says so, and the rule is in one tested function.
- [Many overlapping blocks get narrow] → Labels clip and the tooltip carries the full text; real days rarely overlap more than twice.
- [Rebuilding `Select` touches all forms] → The props stay the same, the focus and keyboard behaviour is tested in the browser for the focus panel and a sheet (task 1.3).
- [A running session crossing midnight] → It is cut at the day's end in the day view and continues in the next day.
