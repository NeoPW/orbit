import { addDays } from '../../../core/dates/today.ts';
import { goalProgress, measureStateAt, type TimedMeasure } from '../../goals/domain/goals.ts';
import { periodBuckets, periodRange, type Bucket, type Period } from './period.ts';

export interface StatsGoal {
  id: string;
  title: string;
  color: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface GoalStatsRows {
  /** Active goals in sort order. */
  goals: StatsGoal[];
  measures: (TimedMeasure & { goalId: string })[];
}

export type Projection =
  | { kind: 'complete' }
  /** The pace window is under 7 days. */
  | { kind: 'early' }
  | { kind: 'stalled' }
  /** `daysVsDeadline` is negative before the deadline, positive after it; null without a deadline. */
  | { kind: 'date'; date: string; daysVsDeadline: number | null };

export interface GoalStatsRow {
  id: string;
  title: string;
  color: string | null;
  hasMeasures: boolean;
  /** Whole percent at the end of the period. */
  progress: number | null;
  /** Percentage points gained in the period; null for zero. */
  change: number | null;
  /** Whole percent at the end of each bucket. */
  series: { bucket: Bucket; value: number | null }[];
  projection: Projection | null;
}

export const PACE_DAYS = 28;
export const MIN_PACE_DAYS = 7;

const localMidnightAfter = (date: string) => {
  const [y, m, d] = addDays(date, 1).split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toISOString();
};
const dayCount = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** A goal's progress (0–1) at the end of `date`, from its measures' values and check-ins then; null without measures. */
export function goalProgressAt(measures: readonly TimedMeasure[], date: string): number | null {
  const instant = localMidnightAfter(date);
  return goalProgress(measures.map((m) => measureStateAt(m, instant, (d) => d <= date).progress));
}

/** The date the goal reaches 100 % if the pace of the last 28 days (or since its start, when shorter) continues. */
export function projectGoal(goal: StatsGoal, measures: readonly TimedMeasure[], asOf: string): Projection {
  const now = goalProgressAt(measures, asOf) ?? 0;
  if (now >= 1) return { kind: 'complete' };
  const window = goal.startDate ? Math.min(PACE_DAYS, dayCount(goal.startDate, asOf)) : PACE_DAYS;
  if (window < MIN_PACE_DAYS) return { kind: 'early' };
  const gain = now - (goalProgressAt(measures, addDays(asOf, -window)) ?? 0);
  if (gain <= 0) return { kind: 'stalled' };
  const days = Math.ceil(((1 - now) * window) / gain - 1e-9);
  const date = addDays(asOf, days);
  return { kind: 'date', date, daysVsDeadline: goal.endDate ? dayCount(goal.endDate, date) : null };
}

/** A row per active goal that had started by the end of the period: progress, change, progress per bucket and projection. */
export function goalStatsRows(rows: GoalStatsRows, period: Period, today: string, allStart: string | null = null): GoalStatsRow[] {
  const { start, end: asOf } = periodRange(period, today, allStart);
  const buckets = periodBuckets(period, today, allStart);
  return rows.goals
    .filter((g) => g.startDate === null || g.startDate <= asOf)
    .map((goal) => {
      const measures = rows.measures.filter((m) => m.goalId === goal.id);
      if (measures.length === 0) {
        return { id: goal.id, title: goal.title, color: goal.color, hasMeasures: false, progress: null, change: null, series: [], projection: null };
      }
      const percent = (p: number | null) => (p === null ? null : Math.round(p * 100));
      const progress = percent(goalProgressAt(measures, asOf));
      const before = percent(goalProgressAt(measures, addDays(start, -1)));
      const change = progress !== null && before !== null && progress !== before ? progress - before : null;
      return {
        id: goal.id,
        title: goal.title,
        color: goal.color,
        hasMeasures: true,
        progress,
        change,
        series: buckets.map((bucket) => ({ bucket, value: percent(goalProgressAt(measures, bucket.end < asOf ? bucket.end : asOf)) })),
        projection: projectGoal(goal, measures, asOf),
      };
    });
}
