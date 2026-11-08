import { localToday } from '../../../core/dates/deadline.ts';
import { addDays } from '../../../core/dates/today.ts';
import type { ScheduleType } from '../../../core/db/schema.ts';
import { weekAdherence } from '../../habits/domain/habits.ts';
import { isWorkOnGoal, type WorkLinks } from '../../work-log/domain/work-log.ts';
import { canStepBack, parsePeriod, periodBuckets, periodDays, periodRange, periodWeeks, stepPeriod, type Bucket, type Period } from './period.ts';

/** Plain rows a period needs; the loader fills them for the shown and the previous period. */
export interface StatsRows {
  goals: { id: string }[];
  projects: { id: string; goalId: string | null }[];
  tasks: { id: string; projectId: string | null; goalId: string | null }[];
  habits: { id: string; active: boolean; scheduleType: ScheduleType; weekdays: number[] | null; timesPerWeek: number | null; createdAt: string }[];
  habitChecks: { habitId: string; date: string }[];
  logEntries: {
    projectId: string | null;
    goalId: string | null;
    taskId: string | null;
    habitId: string | null;
    occurredAt: string;
    durationMinutes: number | null;
  }[];
  /** Completed reviews only. */
  reviews: { weekStart: string; score: number | null }[];
}

export interface Headline {
  minutes: number;
  /** Time worked per day of the period (up to today), unrounded. */
  dailyAverageMinutes: number;
  /** Average review score, one decimal; null without a completed review. */
  score: number | null;
  reviewedWeeks: number;
  weeks: number;
  habitKept: number;
  habitExpected: number;
  /** Whole percent; null without an expected check-in. */
  habitShare: number | null;
  goalMinutes: number;
  /** Whole percent; null without time. */
  goalShare: number | null;
  /** Nothing logged, checked or reviewed in the period. */
  empty: boolean;
}

export interface Comparison {
  /** Whole percent change of the daily average. */
  dailyAverage: number | null;
  /** Difference of the average score, one decimal. */
  score: number | null;
  /** Percentage points. */
  habitShare: number | null;
  goalShare: number | null;
}

export interface TrendPoint {
  bucket: Bucket;
  minutes: number;
  score: number | null;
  habitShare: number | null;
  goalShare: number | null;
}

interface DatedEntry {
  date: string;
  minutes: number;
  onGoal: boolean;
}

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

function datedEntries(rows: StatsRows): DatedEntry[] {
  const links: WorkLinks = {
    projectGoals: new Map(rows.projects.map((p) => [p.id, p.goalId])),
    tasks: new Map(rows.tasks.map((t) => [t.id, { projectId: t.projectId, goalId: t.goalId }])),
  };
  return rows.logEntries.map((e) => ({
    date: localToday(new Date(e.occurredAt)),
    minutes: e.durationMinutes ?? 0,
    onGoal: rows.goals.some((g) => isWorkOnGoal(e, g.id, links)),
  }));
}

function timeIn(entries: DatedEntry[], start: string, end: string) {
  let minutes = 0;
  let goalMinutes = 0;
  let count = 0;
  for (const e of entries) {
    if (e.date < start || e.date > end) continue;
    count += 1;
    minutes += e.minutes;
    if (e.onGoal) goalMinutes += e.minutes;
  }
  return { minutes, goalMinutes, count };
}

/** Check-ins kept (counted up to what each active habit expects) and expected in the week starting on `monday`. */
function habitsIn(rows: StatsRows, monday: string, today: string) {
  const week = { start: monday, end: addDays(monday, 6) };
  let kept = 0;
  let expected = 0;
  for (const h of rows.habits.filter((h) => h.active)) {
    const checks = rows.habitChecks.filter((c) => c.habitId === h.id).map((c) => c.date);
    const adherence = weekAdherence(h, checks, week, today);
    kept += Math.min(adherence.done, adherence.expected);
    expected += adherence.expected;
  }
  return { kept, expected };
}

function scoresIn(rows: StatsRows, weeks: string[]): number[] {
  const set = new Set(weeks);
  return rows.reviews.filter((r) => set.has(r.weekStart) && r.score !== null).map((r) => r.score as number);
}

const average = (values: number[]) => (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** The headline figures of a period. `firstUse` is the first date with data, for "All time". */
export function periodHeadline(rows: StatsRows, period: Period, today: string, firstUse: string | null = null): Headline {
  const { start, end } = periodRange(period, today, firstUse);
  const entries = datedEntries(rows);
  const time = timeIn(entries, start, end);
  const weeks = periodWeeks(period, today, firstUse);
  let habitKept = 0;
  let habitExpected = 0;
  for (const monday of weeks) {
    const h = habitsIn(rows, monday, today);
    habitKept += h.kept;
    habitExpected += h.expected;
  }
  const scores = scoresIn(rows, weeks);
  const days = periodDays(period, today, firstUse);
  const score = average(scores);
  const checked = rows.habitChecks.some((c) => c.date >= start && c.date <= end);
  return {
    minutes: time.minutes,
    dailyAverageMinutes: days > 0 ? time.minutes / days : 0,
    score: score === null ? null : oneDecimal(score),
    reviewedWeeks: scores.length,
    weeks: weeks.length,
    habitKept,
    habitExpected,
    habitShare: percent(habitKept, habitExpected),
    goalMinutes: time.goalMinutes,
    goalShare: percent(time.goalMinutes, time.minutes),
    empty: time.count === 0 && !checked && scores.length === 0 && rows.reviews.every((r) => !weeks.includes(r.weekStart)),
  };
}

/** The change from the previous period of the same kind; nothing for "All time" or where either side has no value. */
export function comparePeriods(current: Headline, previous: Headline | null, period: Period): Comparison {
  const none: Comparison = { dailyAverage: null, score: null, habitShare: null, goalShare: null };
  if (period.kind === 'all' || previous === null) return none;
  const points = (a: number | null, b: number | null) => (a === null || b === null ? null : a - b);
  return {
    dailyAverage:
      previous.dailyAverageMinutes > 0
        ? Math.round(((current.dailyAverageMinutes - previous.dailyAverageMinutes) / previous.dailyAverageMinutes) * 100)
        : null,
    score: current.score === null || previous.score === null ? null : oneDecimal(current.score - previous.score),
    habitShare: points(current.habitShare, previous.habitShare),
    goalShare: points(current.goalShare, previous.goalShare),
  };
}

/** Headline of the previous period of the same kind, for the comparison; null for "All time". */
export function previousHeadline(rows: StatsRows, period: Period, today: string, firstUse: string | null = null): Headline | null {
  const previous = stepPeriod(period, -1);
  return previous && canStepBack(period, firstUse) ? periodHeadline(rows, previous, today, firstUse) : null;
}

/** One point per bucket (week or month); later buckets are left out, and a figure without a value is null. */
export function periodTrend(rows: StatsRows, period: Period, today: string, firstUse: string | null = null): TrendPoint[] {
  const entries = datedEntries(rows);
  return periodBuckets(period, today, firstUse).map((bucket) => {
    const time = timeIn(entries, bucket.start, bucket.end);
    const weeks = period.kind === 'month' || period.kind === 'quarter' ? [bucket.key] : periodWeeks(parsePeriod(bucket.key, today), today, firstUse);
    let kept = 0;
    let expected = 0;
    for (const monday of weeks) {
      const h = habitsIn(rows, monday, today);
      kept += h.kept;
      expected += h.expected;
    }
    const score = average(scoresIn(rows, weeks));
    return {
      bucket,
      minutes: time.minutes,
      score: score === null ? null : oneDecimal(score),
      habitShare: percent(kept, expected),
      goalShare: percent(time.goalMinutes, time.minutes),
    };
  });
}
