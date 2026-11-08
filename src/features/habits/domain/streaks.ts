import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import { isoWeekday, weekStartOf, type HabitSchedule } from './habits.ts';

type StreakHabit = Pick<HabitSchedule, 'scheduleType' | 'weekdays' | 'timesPerWeek'> & { createdAt: string };

export interface Streak {
  current: number;
  best: number;
  /** Days for daily and weekdays habits, weeks for times-per-week habits. */
  unit: 'days' | 'weeks';
}

export type DayState = 'checked' | 'missed' | 'neutral';

const createdOn = (habit: StreakHabit) => localToday(new Date(habit.createdAt));

function dueOn(habit: StreakHabit, date: string): boolean {
  return habit.scheduleType === 'daily' || (habit.scheduleType === 'weekdays' && (habit.weekdays ?? []).includes(isoWeekday(date)));
}

/**
 * Current and best streak (see habits, "Habit streak"): consecutive due days checked, or consecutive weeks that
 * reached the weekly target. Today (or the current week) still open is pending, not a break.
 */
export function habitStreak(habit: StreakHabit, checkDates: readonly string[], today: string): Streak {
  const checks = new Set(checkDates);
  let run = 0;
  let best = 0;
  if (habit.scheduleType === 'times_per_week') {
    const target = habit.timesPerWeek ?? 0;
    const thisWeek = weekStartOf(today);
    for (let week = weekStartOf(createdOn(habit)); week <= thisWeek; week = addDays(week, 7)) {
      let done = 0;
      for (let i = 0; i < 7; i += 1) if (checks.has(addDays(week, i))) done += 1;
      if (done >= target) {
        run += 1;
        best = Math.max(best, run);
      } else if (week !== thisWeek) run = 0;
    }
    return { current: run, best, unit: 'weeks' };
  }
  for (let date = createdOn(habit); date <= today; date = addDays(date, 1)) {
    if (!dueOn(habit, date)) continue;
    if (checks.has(date)) {
      run += 1;
      best = Math.max(best, run);
    } else if (date !== today) run = 0;
  }
  return { current: run, best, unit: 'days' };
}

/** The state of each day from `from` to `to`: checked, missed (a due, unchecked day before today) or neutral. */
export function habitDayStates(habit: StreakHabit, checkDates: readonly string[], from: string, to: string, today: string): Map<string, DayState> {
  const checks = new Set(checkDates);
  const created = createdOn(habit);
  const states = new Map<string, DayState>();
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (checks.has(date)) states.set(date, 'checked');
    else if (date >= created && date < today && dueOn(habit, date)) states.set(date, 'missed');
    else states.set(date, 'neutral');
  }
  return states;
}
