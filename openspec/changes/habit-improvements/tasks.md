# Tasks

## 1. Schema

- [ ] 1.1 Add `durationMinutes: integer('duration_minutes')` (nullable, with a doc comment) to `habits` in `src/core/db/schema.ts`; run `npm run db:generate` and `npm run db:generate:server` and check that the new `drizzle/0009_*.sql` and `server/migrations/0009_*.sql` only add the column (no regenerated earlier migration). Verify with `npx vitest run src/core/db server/src/schema.test.ts`.

## 2. Habit duration

- [ ] 2.1 In `src/features/habits/domain/habits.ts`, add `validateDuration(text)` (empty → null, whole number 1–1440, else an error) and extend `scheduleSummary` to append ` · N min` when a duration is given. Test "Set a duration" (summary), "No duration" and "Invalid duration" in `habits.test.ts`. Verify with `npx vitest run src/features/habits/domain`.
- [ ] 2.2 In `src/features/habits/data/habits-repository.ts`, add `durationMinutes` to `HabitInput`, `HabitErrors` and `validate`, stored by `createHabit`/`updateHabit`. Test "Clear the duration" and an invalid value being rejected in `habits-repository.test.ts`. Verify with `npx vitest run src/features/habits/data`.
- [ ] 2.3 In `src/features/habits/ui/HabitSheet.tsx`, add an optional "Duration (minutes)" number field (`inputMode="numeric"`) with its error, and pass the duration to the summary in `HabitsSection.tsx` and wherever `scheduleSummary` is shown (project detail, goal page). Verify with `npx tsc --noEmit`.

## 3. Start with the habit's duration

- [ ] 3.1 In `src/features/timer/data/timer-repository.ts`, make `startTimer` set `plannedMinutes` to the habit's `durationMinutes` for a habit target (null otherwise), and update its doc comment. Test "Habit with a duration", "Start from a habit chip" (no duration → no limit) and "Change a habit's limit" (setting the limit leaves the habit's duration) in `timer-repository.test.ts`; test in `src/features/notifications/data/reminder-input.test.ts` that a session started for "Stretch" (20 min) yields a limit reminder at 20 minutes worked. Verify with `npx vitest run src/features/timer/data src/features/notifications/data`.

## 4. Check for yesterday

- [ ] 4.1 In `src/features/habits/domain/habits.ts`, add `checkTime(date, today, reminderTime, now)`: `now` for today, else `date` at the reminder time or 12:00 local, as an ISO UTC string. Test "Check yesterday" (07:30), "Without a reminder time" (12:00) and today in `habits.test.ts`; add "Streak repaired" and "Last week's target" to `streaks.test.ts`. Verify with `npx vitest run src/features/habits/domain`.
- [ ] 4.2 In `checkHabit` (`habits-repository.ts`), use `checkTime` for the log entry's `occurredAt` (today's local date from the clock). Test "Check yesterday", "Uncheck yesterday" and "No duplicate check" for yesterday in `habits-repository.test.ts`. Verify with `npx vitest run src/features/habits/data`.
- [ ] 4.3 In `src/features/habits/domain/habits.ts`, add `offeredYesterday(habit, yesterday, checkedYesterday)` (active and scheduled that weekday, `times_per_week` always; or already checked). Test "Not scheduled yesterday", "Inactive habit" and "Checked but not scheduled" in `habits.test.ts`; add `isChecked(db, habitId, date)` to `habits-repository.ts`. Verify with `npx vitest run src/features/habits`.
- [ ] 4.4 In `src/features/habits/ui/HabitSheet.tsx` (+ `.module.css`), show a "Done yesterday" toggle (`Checkbox`) above the form for an existing habit when `offeredYesterday` holds; toggling calls `checkHabit`/`uncheckHabit` for yesterday at once, independent of Save and Cancel. Verify with `npx tsc --noEmit`.

## 5. Product spec

- [ ] 5.1 Update `docs/SPEC.md`: §4 Habit (`duration_minutes`), §5 Habits (checking yesterday, the entry's time), §5 Timer and focus and §6.1 focus panel ("a session starts without a time limit" except a habit with a duration), §6.3 the "Done yesterday" toggle in the habit sheet. Verify by reading the changed sections against this change's specs.

## 6. Verification

- [ ] 6.1 Check in the browser (`npm run dev`) at desktop and phone width and in the desktop app (`npm run desktop`): create "Stretch" with 20 minutes, start it from its chip and from the focus panel (20-minute limit shown), change the limit in focus mode; open a habit in Plan, tick "Done yesterday", see its dot on yesterday's timeline and the streak, untick it; check the toggle is missing for a habit not scheduled yesterday; on the phone too.
- [ ] 6.2 Run `npm run check` and fix any failures.
