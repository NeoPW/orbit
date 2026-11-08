import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import { isDue, isoWeekday, type HabitSchedule } from '../../habits/domain/habits.ts';
import { formatWeekFull, reviewWeekStart } from '../../review/domain/review-week.ts';
import type { Settings } from '../../settings/data/settings.ts';

export interface ReminderHabit extends HabitSchedule {
  id: string;
  title: string;
  /** `HH:mm`, or null for the default reminder time. */
  reminderTime: string | null;
  /** Title of the linked project or goal. */
  linkTitle: string | null;
}

/** Everything the plan depends on, as plain data (the loader fills it from the database). */
export interface ReminderInput {
  habits: ReminderHabit[];
  /** Habit checks of the current week at least. */
  checks: { habitId: string; date: string }[];
  /** Open tasks with a due date, of active projects or outside projects. */
  tasks: { id: string; title: string; dueDate: string }[];
  /** Active projects with an own deadline. */
  projects: { id: string; title: string; deadline: string }[];
  /** Weeks (Mondays) whose review is completed. */
  completedReviewWeeks: string[];
  /** The running (not paused) session, when it has a time limit: its current stretch start, seconds worked before it, and the limit in minutes. */
  focus: { title: string; startedAt: string; workedSeconds: number; limitMinutes: number } | null;
}

export type ReminderSettings = Pick<Settings, 'remindersOn' | 'reminderTime' | 'leadDays' | 'reviewDay' | 'reviewTime'>;

/** What a reminder is about, for the phone's check with the server before showing it (none for the end of a session or the review). */
export type ReminderTarget = { kind: 'habit'; id: string; date: string } | { kind: 'task'; id: string } | { kind: 'project'; id: string };

export interface PlannedReminder {
  /** Stable for the same reminder, so a runner can show it once. */
  key: string;
  at: Date;
  title: string;
  body: string;
  /** App path opened when the notification is clicked. */
  route: string;
  target?: ReminderTarget;
}

/** Local date `yyyy-mm-dd` and time `HH:mm` as an instant. */
function localInstant(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0);
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/**
 * The reminders that fall from `now` up to and including `until`, earliest first. With reminders off
 * only the end of a focus session remains. Reminders before `now` are left out.
 */
export function planReminders(input: ReminderInput, settings: ReminderSettings, now: Date, until: Date): PlannedReminder[] {
  const result: PlannedReminder[] = [];
  const add = (reminder: PlannedReminder) => {
    if (reminder.at >= now && reminder.at <= until) result.push(reminder);
  };

  // The limit counts worked time, so it falls when the minutes still missing have passed since this stretch began.
  if (input.focus && input.focus.limitMinutes * 60 > input.focus.workedSeconds) {
    const at = new Date(new Date(input.focus.startedAt).getTime() + (input.focus.limitMinutes * 60 - input.focus.workedSeconds) * 1000);
    add({
      key: `focus:${input.focus.startedAt}:${input.focus.limitMinutes}`,
      at,
      title: `${input.focus.title}: ${plural(input.focus.limitMinutes, 'minute')} done`,
      body: 'The timer keeps running',
      route: '/focus',
    });
  }

  if (settings.remindersOn) {
    const lastDate = localToday(until);
    for (let date = localToday(now); date <= lastDate; date = addDays(date, 1)) {
      for (const habit of input.habits) {
        const checkDates = input.checks.filter((c) => c.habitId === habit.id).map((c) => c.date);
        if (checkDates.includes(date) || !isDue(habit, date, checkDates)) continue;
        add({
          key: `habit:${habit.id}:${date}`,
          at: localInstant(date, habit.reminderTime ?? settings.reminderTime),
          title: habit.title,
          body: habit.linkTitle ?? '',
          route: '/home',
          target: { kind: 'habit', id: habit.id, date },
        });
      }

      const deadlines = [
        ...input.tasks.map((t) => ({ kind: 'task' as const, id: t.id, title: t.title, due: t.dueDate, route: `/tasks/${t.id}` })),
        ...input.projects.map((p) => ({ kind: 'project' as const, id: p.id, title: p.title, due: p.deadline, route: `/projects/${p.id}` })),
      ];
      for (const item of deadlines) {
        if (item.due === date) {
          add({
            key: `deadline:${item.kind}:${item.id}:${date}:due`,
            at: localInstant(date, settings.reminderTime),
            title: item.title,
            body: 'Due today',
            route: item.route,
            target: { kind: item.kind, id: item.id },
          });
        }
        if (addDays(item.due, -settings.leadDays) === date) {
          add({
            key: `deadline:${item.kind}:${item.id}:${item.due}:lead`,
            at: localInstant(date, settings.reminderTime),
            title: item.title,
            body: `Due in ${plural(settings.leadDays, 'day')}`,
            route: item.route,
            target: { kind: item.kind, id: item.id },
          });
        }
      }

      if (isoWeekday(date) === settings.reviewDay) {
        const week = reviewWeekStart(date);
        if (!input.completedReviewWeeks.includes(week)) {
          add({
            key: `review:${date}`,
            at: localInstant(date, settings.reviewTime),
            title: 'Weekly review',
            body: formatWeekFull(week),
            route: '/review/flow',
          });
        }
      }
    }
  }

  return result.sort((a, b) => a.at.getTime() - b.at.getTime() || a.key.localeCompare(b.key));
}
