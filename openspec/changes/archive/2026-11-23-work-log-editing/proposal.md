# Proposal

## Why

Logging time on a task that belongs to a project is impossible from Home's Log work: the sheet only lists projects and tasks outside projects, so time on "Draft intro" of "Thesis" can only go to the project. And work logged with the wrong time or length can only be deleted and logged again, because the day timeline opens the task, not the entry. Both come from usage feedback (feedback.md, "Implement now").

## What Changes

- Log work (docs/SPEC.md §6.1) lists every active project followed by its open tasks, then the open tasks outside projects. Recently used items still come first, now also among a project's tasks.
- Clicking a block or dot on the day timeline (Home, the review's week, the phone's Today; docs/SPEC.md §6.1, §6.5) opens an editor for that log entry: its start time, duration and note can be changed, the entry can be deleted, and a link opens what it belongs to (the task popup, else the project, else the goal). Workout blocks keep opening their read-only summary.
- A block made of several merged timer stretches first lists its stretches, so one of them can be chosen for editing.
- Editing keeps the entry on its day, its source and what it belongs to. A habit check stays on its date.

Out of scope:
- Changing what an entry belongs to (moving it to another task or project) or its day.
- Editing entries from the log lists on the project, task or goal pages (they keep delete only).
- Editing workout entries (they come from the session on the phone).
- Recalculating a running or paused focus session's worked time after one of its stretches is edited.
- A search or filter field in Log work.

## Capabilities

### New Capabilities

### Modified Capabilities
- `work-log`: Log work lists a project's open tasks under it; recently used ordering also applies within a project; new "Edit log entry" requirement.
- `day-timeline`: clicking a non-workout block or dot opens the entry editor instead of the task; a merged block lists its stretches; the phone's Today opens the editor full screen.

## Impact

- `src/features/work-log/` — `listLogTargets` and `recentFirst` grouping in `data/log-repository.ts` and `domain/work-log.ts`; `LogWorkSheet.tsx`; a new update query and an entry editor sheet; a pure function that turns an edited start and duration into `occurred_at` for the entry's source.
- `src/features/timeline/` — merged items must keep the ids of all their entries (`domain/day-timeline.ts`, `data/timeline-loader.ts`); `DayTimeline.tsx` opens the editor instead of `openTarget`.
- No schema change and no migration; edits sync as a normal row update (last write wins).
- docs/SPEC.md §6.1 (Log work, timeline) needs a line about editing entries after archive.
