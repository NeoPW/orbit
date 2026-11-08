import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { loadPeriodStats, type PeriodStats } from '../data/period-loader.ts';
import type { Period } from '../domain/period.ts';

/** The stats of a period, kept up to date after every change. */
export function usePeriodStats(period: Period): PeriodStats | undefined {
  const today = useToday();
  return useLiveQuery((db) => loadPeriodStats(db, period, today), [period.key, today]);
}
