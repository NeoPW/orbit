# Design

## Context

A log entry's `occurred_at` means two things depending on its source: a timer or workout entry stores its start, every other entry stores its end (`blockTimes` in `src/features/timeline/domain/day-timeline.ts`). Timer stretches of one item are merged into one timeline item in `mergeStretches`, which keeps only the first entry's id. Timeline clicks go through `openTarget` in `DayTimeline.tsx`; the task popup and workout summary are opened through providers in `src/app/Shell.tsx`. No schema change is needed.

## Goals / Non-Goals

**Goals:**
- One entry editor shared by every timeline (Home, review week, phone Today).
- Keep the meaning of `occurred_at` per source when an entry is edited.

**Non-Goals:**
- Changing an entry's links (task, habit, project, goal) or its day.
- Keeping a focus session's `worked_seconds` in step with edited stretches.

## Decisions

- **Edit as start + duration, store per source.** A pure function `editedOccurrence(entry, startHHmm, durationMinutes, now)` in `work-log/domain/work-log.ts` builds the start on the entry's local day (the day of its block start) and returns `start` for `timer`, `start + duration` (or `start`) for other sources, or an error for a future start. The editor pre-fills the start from `blockTimes`. Alternative: edit `occurred_at` directly — rejected, the user would have to know which sources store the end.
- **The day is fixed.** Only a time of day is entered, so a habit check's `log_entry` stays on its check's date without touching `habit_checks`. A block that crosses midnight keeps the day its start is on.
- **Merged items keep all their entry ids.** `mergeStretches` collects `entryIds` (and each stretch's times and minutes) on the merged item; the timeline opens the stretch list when there is more than one logged stretch. The running timer item has no entry id. Alternative: edit the merged block as a whole — rejected, its minutes are a sum of separate rows.
- **Update query in the repository.** `updateLogEntry(db, clock, id, { occurredAt, durationMinutes, note })` sets `updated_at`; sync then carries it like any row (last write wins).
- **Editor host like the task popup.** An `EntryEditorProvider` in `src/app/Shell.tsx` with `useOpenEntryEditor()` renders the editor in a `Sheet` (full screen on the phone), so `DayTimeline` needs no per-screen wiring. The stretch list is a small first step of the same sheet.
- **Log work grouping in the repository.** `listLogTargets` returns active projects with their open tasks (`tasks: {id,title}[]` per project) plus the open tasks outside projects; the existing `recentFirst` sorts each list with `lastLoggedBy(entries, 'projectId' | 'taskId')`. Project recency already includes task and habit entries, since those rows carry the project id.

## Risks / Trade-offs

- [Editing a stretch of a paused session leaves the session's worked time unchanged] → The focus timer shows the old total until the session ends; accepted, the log is the record.
- [Long Log work list with many projects and tasks] → Tasks are indented under their project; a filter field is left for later.
- [Two devices edit the same entry] → Last write wins, as for every row.
