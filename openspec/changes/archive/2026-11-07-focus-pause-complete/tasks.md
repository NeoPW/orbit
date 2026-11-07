# Tasks

## 1. Schema and session logic

- [x] 1.1 Add `paused_at`, `worked_minutes` (default 0) and `last_entry_id` to `timers` in `src/core/db/schema.ts`; run `npm run db:generate` and `npm run db:generate:server` (new `drizzle/0003_*`, `server/migrations/0003_*`); extend `src/core/db/migrate.test.ts` for a running timer surviving the migration.
- [x] 1.2 Domain helpers in `src/features/timer/domain/timer.ts`: worked time (logged minutes + running stretch, frozen while paused) and overtime against the limit; tests in `timer.test.ts` (Pause and resume "Resume", Time limit "Overtime", "Remove the limit").
- [x] 1.3 `src/features/timer/data/timer-repository.ts`: `startTimer` (no length, logs a running stretch, resets the session), `pauseTimer`, `resumeTimer`, `completeTimer` (note on the stretch or on `last_entry_id`, task done, habit checked), `discardTimer` (running stretch dropped), `setTimerLimit`; remove `stopTimer`. Tests in `timer-repository.test.ts` for the Pause and resume, Complete a session, Discard a timer, One timer at a time and Target removed scenarios.
- [x] 1.4 `src/features/timer/data/timer-view.ts`: expose paused state, worked minutes and limit; keep the next-step prompt for Complete; update `timer-view.test.ts`.

## 2. Timeline and reminder

- [x] 2.1 `mergeStretches` in `src/features/timeline/domain/day-timeline.ts` and its use in `src/features/timeline/data/timeline-loader.ts` (items get a timer target key); tests for the "Resumed stretches as one block" scenarios in `day-timeline.test.ts`, the running and paused cases in `timeline-loader.test.ts`.
- [x] 2.2 End-of-session reminder from the limit: `src/features/notifications/data/reminder-input.ts` and `domain/plan-reminders.ts` (fires at start + limit − worked, only while running, key with the limit); tests in `plan-reminders.test.ts` for "Limit after a pause", "Open-ended session" and "Limit already passed".

## 3. UI

- [x] 3.1 Starting without a length: remove the segments from `src/features/timer/ui/FocusPanel.tsx`, make `StartFocusButton.tsx` a plain button, drop `startWithLastLength` and `focusMinutes` from `useStartFocus.ts` and `src/features/settings/data/settings.ts`; update callers in `src/features/home/ui/HomeScreen.tsx` and `src/features/tasks/ui/TaskPage.tsx`.
- [x] 3.2 Session actions: replace `useStopTimer.tsx` with `useSessionActions.tsx` (Pause and Resume without dialog, Complete with the dialog, Discard with a confirmation only while running); rename `StopDialog.tsx` to `CompleteDialog.tsx`.
- [x] 3.3 Focus panel with a session: worked time, "Paused", limit and overtime, Pause or Resume, Complete and "Focus mode" (`FocusPanel.tsx`, `TimerReadout.tsx`).
- [x] 3.4 Focus mode: Discard icon button in the top-right corner, Pause/Resume and Complete under the timer, "Time limit" menu (15, 30, 45, 60, 90, Custom…, No limit) with a minutes field for Custom (`FocusMode.tsx`, `FocusMode.module.css`); works at phone width.
- [x] 3.5 Exact worked time: replace `worked_minutes` with `worked_seconds` (`src/core/db/schema.ts`, regenerate the not yet released `0003` migrations for app and server instead of adding a fourth), use it in `timer.ts`, `timer-repository.ts`, `reminder-input.ts` and `plan-reminders.ts`; tests for "Short stretch" and "Exact over several pauses" in `timer-repository.test.ts`.
- [x] 3.6 Total time worked: grouped sum query in `src/features/work-log/data/log-repository.ts` with tests for the "Total time worked" scenarios; show it on `src/features/tasks/ui/TaskPage.tsx`, `src/features/projects/ui/ProjectPage.tsx` and at the right of each row in `src/features/habits/ui/HabitsSection.tsx`.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md` §4 (Timer columns), §5 (Timer and focus), §6.1 (focus panel, focus mode, Today timeline merge), §6.2 (time worked on pages and in Plan) and §7 (focus session notification).
- [x] 4.2 Run `npm run check`; it must pass.
- [ ] 4.3 Verify in the desktop app and the browser: start from a row, pause, resume within and after 10 minutes (one and two blocks on Today), set a limit and hear the sound, complete a task with a note, discard after a pause; and on the Android emulator the same flow at phone width.
- [ ] 4.4 Deploy the sync server with schema 4 (`npm run server:deploy`) after the user's go-ahead, then check sync of a paused session between desktop and phone.
