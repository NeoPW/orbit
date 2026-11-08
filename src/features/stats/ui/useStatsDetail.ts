import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { loadStatsDetail, type StatsDetail } from '../data/detail-loader.ts';
import type { Period } from '../domain/period.ts';

/** The calendar, heatmap and habit data of a period, kept up to date after every change. */
export function useStatsDetail(period: Period): StatsDetail | undefined {
  const today = useToday();
  return useLiveQuery((db) => loadStatsDetail(db, period, today), [period.key, today]);
}
