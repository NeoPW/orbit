# Tasks

## 1. Log work grouped by project

- [x] 1.1 Change `listLogTargets` in `src/features/work-log/data/log-repository.ts` to return the active projects each with their open tasks, plus the open tasks outside projects; extend `log-repository.test.ts` with "Log on a project's task" (target listed under its project) and "Tasks of inactive projects", and verify with `npx vitest run src/features/work-log/data`
- [x] 1.2 Sort each project's tasks with `recentFirst` (`src/features/work-log/domain/work-log.ts`) and add the "Tasks within a project" and "Task work counts for the project" cases to `work-log.test.ts`; verify with `npx vitest run src/features/work-log/domain`
- [x] 1.3 Render each project's tasks indented below it in `src/features/work-log/ui/LogWorkSheet.tsx` (+ `.module.css`); clicking a project's task saves an entry for the task (project and goal through `addManualEntry`); verify in the browser that logging 30 minutes on a project task shows it on the task and project pages

## 2. Edit an entry

- [x] 2.1 Add `editedOccurrence(entry, start, durationMinutes, now)` to `src/features/work-log/domain/work-log.ts` with tests in `work-log.test.ts` for "Shorter manual entry", "Move a timer stretch", "Add time to a dot" and "Start in the future"; verify with `npx vitest run src/features/work-log/domain`
- [x] 2.2 Add `updateLogEntry(db, clock, id, { occurredAt, durationMinutes, note })` to `src/features/work-log/data/log-repository.ts` with a test that it changes only those fields and `updated_at`, and that a habit check stays on its date ("Habit check keeps its date"); verify with `npx vitest run src/features/work-log/data`
- [x] 2.3 Create `src/features/work-log/ui/EntryEditor.tsx` (+ `.module.css`): a `Sheet` with start, duration and note, Save and Cancel, errors from `parseDuration` and `editedOccurrence`, the link to the task popup / project / goal, and Delete through `deleteLogEntry` with confirmation via `useMessages()`; expose `EntryEditorProvider` and `useOpenEntryEditor()` and mount the provider in `src/app/Shell.tsx`; verify `npx tsc --noEmit` passes

## 3. Open the editor from the timeline

- [x] 3.1 Keep the entry ids, times and minutes of every logged stretch on merged items in `mergeStretches` (`src/features/timeline/domain/day-timeline.ts`) and carry each entry's id through `src/features/timeline/data/timeline-loader.ts`; add a "Merged block" case (two stretches, ids and minutes kept; running stretch not among them) to `day-timeline.test.ts`; verify with `npx vitest run src/features/timeline`
- [x] 3.2 In `src/features/timeline/ui/DayTimeline.tsx`, replace `openTarget` for non-workout items: one logged entry opens the editor, several open the stretch list in the editor sheet, a running block without logged stretches opens its target as before; workout blocks keep the summary; verify in the browser that clicking a block, a dot, a merged block and a workout block behaves as in the day-timeline delta

## 4. Verification

- [x] 4.1 Run `npm run check` and verify it passes
- [x] 4.2 Verify in the desktop app (`npm run desktop`) and the browser (`npm run dev`): Log work lists project tasks, an entry's time and note can be edited and deleted from Home's timeline and the review's week timeline; verify in a narrow browser window (< 640 px) that the editor opens full screen from Today
