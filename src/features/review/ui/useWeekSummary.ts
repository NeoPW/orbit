import { useLiveQuery } from '../../../core/db/live.ts';
import { useToday } from '../../../core/dates/today.ts';
import { useSettings } from '../../settings/data/settings.ts';
import { loadWeek } from '../data/week-loader.ts';
import type { WeekSummary } from '../domain/week-summary.ts';

/** The summary of a week, kept up to date after every change. `live` shows current goal progress even for a reviewed week. */
export function useWeekSummary(weekStart: string, options: { live?: boolean } = {}): WeekSummary | undefined {
  const today = useToday();
  const live = options.live ?? false;
  const targetHours = useSettings().settings.weeklyTargetHours;
  return useLiveQuery((db) => loadWeek(db, weekStart, today, { live, targetHours }), [weekStart, today, live, targetHours]);
}
