import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import type { ScheduleType } from '../../../core/db/schema.ts';
import { weekAdherence } from '../../habits/domain/habits.ts';
import { habitStreak, type Streak } from '../../habits/domain/streaks.ts';
import { periodRange, periodWeeks, type Period } from './period.ts';

export interface HabitRows {
  habits: { id: string; title: string; active: boolean; scheduleType: ScheduleType; weekdays: number[] | null; timesPerWeek: number | null; createdAt: string }[];
  checks: { habitId: string; date: string }[];
  entries: { habitId: string | null; occurredAt: string; durationMinutes: number | null }[];
}

export interface HabitStatsRow {
  id: string;
  title: string;
  streak: Streak;
  kept: number;
  expected: number;
  /** Whole percent; null without an expected check-in. */
  share: number | null;
  /** Minutes logged on the habit in the period. */
  minutes: number;
}

/** A row per active habit: streaks, check-ins kept of expected and time in the period; longest current streak first, then by title. */
export function habitStatsRows(rows: HabitRows, period: Period, today: string, allStart: string | null = null): HabitStatsRow[] {
  const { start, end } = periodRange(period, today, allStart);
  const weeks = periodWeeks(period, today, allStart);
  return rows.habits
    .filter((h) => h.active)
    .map((h) => {
      const checks = rows.checks.filter((c) => c.habitId === h.id).map((c) => c.date);
      let kept = 0;
      let expected = 0;
      for (const monday of weeks) {
        const a = weekAdherence(h, checks, { start: monday, end: addDays(monday, 6) }, today);
        kept += Math.min(a.done, a.expected);
        expected += a.expected;
      }
      const minutes = rows.entries
        .filter((e) => e.habitId === h.id && (e.durationMinutes ?? 0) > 0)
        .filter((e) => {
          const date = localToday(new Date(e.occurredAt));
          return date >= start && date <= end;
        })
        .reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
      return {
        id: h.id,
        title: h.title,
        streak: habitStreak(h, checks, today),
        kept,
        expected,
        share: expected > 0 ? Math.round((kept / expected) * 100) : null,
        minutes,
      };
    })
    .sort((a, b) => b.streak.current - a.streak.current || a.title.localeCompare(b.title));
}
