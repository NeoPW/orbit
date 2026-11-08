import { describe, expect, it } from 'vitest';
import { comparePeriods, periodHeadline, periodTrend, previousHeadline, type StatsRows } from './period-stats.ts';
import { parsePeriod } from './period.ts';

const today = '2026-11-08';
const at = (date: string) => new Date(`${date}T12:00:00`).toISOString();
const entry = (date: string, minutes: number, projectId: string | null = null) => ({
  projectId,
  goalId: null,
  taskId: null,
  habitId: null,
  occurredAt: at(date),
  durationMinutes: minutes,
});

function rows(over: Partial<StatsRows> = {}): StatsRows {
  return {
    goals: [{ id: 'g1' }],
    projects: [{ id: 'on-goal', goalId: 'g1' }, { id: 'loose', goalId: null }],
    tasks: [],
    habits: [],
    habitChecks: [],
    logEntries: [],
    reviews: [],
    ...over,
  };
}

const headline = (r: StatsRows, key: string, firstUse: string | null = null) => periodHeadline(r, parsePeriod(key, today), today, firstUse);

describe('time across two months', () => {
  it('counts each entry by its local date', () => {
    const r = rows({ logEntries: [entry('2026-09-30', 120), entry('2026-10-01', 180)] });
    expect(headline(r, '2026-09').minutes).toBe(120);
    expect(headline(r, '2026-10').minutes).toBe(180);
  });
});

describe('daily average', () => {
  it('divides by the days up to today in the current month', () => {
    const r = rows({ logEntries: [entry('2026-11-02', 40 * 60)] });
    expect(headline(r, '2026-11').dailyAverageMinutes).toBe(5 * 60);
  });

  it('divides by all days of a past month', () => {
    const r = rows({ logEntries: [entry('2026-10-05', 62 * 60)] });
    expect(headline(r, '2026-10').dailyAverageMinutes).toBe(2 * 60);
  });
});

describe('review score', () => {
  const reviews = [
    { weekStart: '2026-09-28', score: 6 },
    { weekStart: '2026-10-05', score: 7 },
    { weekStart: '2026-10-12', score: 8 },
    { weekStart: '2026-10-19', score: 8 },
  ];

  it('averages the weeks of the period with one decimal', () => {
    const h = headline(rows({ reviews }), '2026-10');
    expect(h.score).toBe(7.3);
    expect(h.reviewedWeeks).toBe(4);
    expect(h.weeks).toBe(5);
  });

  it('has no score without a completed review', () => {
    expect(headline(rows(), '2026-10').score).toBeNull();
  });
});

describe('habit adherence', () => {
  it('sums kept and expected check-ins over the weeks', () => {
    const habits = [{ id: 'h', active: true, scheduleType: 'times_per_week' as const, weekdays: null, timesPerWeek: 3, createdAt: '2026-01-01T00:00:00Z' }];
    const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-12'];
    const r = rows({ habits, habitChecks: days.map((date) => ({ habitId: 'h', date })) });
    const h = periodHeadline(r, parsePeriod('2026-10', today), today);
    // Weeks of October: 09-28, 10-05, 10-12, 10-19, 10-26 (Thursdays in October); 3 expected each, 4 checks in total.
    expect(h.habitExpected).toBe(15);
    expect(h.habitKept).toBe(4);
    expect(h.habitShare).toBe(27);
  });
});

describe('share on goals', () => {
  it('counts time on projects serving a goal', () => {
    const r = rows({ logEntries: [entry('2026-10-05', 30 * 60, 'on-goal'), entry('2026-10-06', 10 * 60, 'loose')] });
    const h = headline(r, '2026-10');
    expect(h.goalMinutes).toBe(30 * 60);
    expect(h.goalShare).toBe(75);
  });
});

describe('comparison', () => {
  it('shows the change against the previous period', () => {
    const r = rows({
      logEntries: [entry('2026-10-05', 124 * 60), entry('2026-11-03', 40 * 60)],
      reviews: [{ weekStart: '2026-10-05', score: 6 }, { weekStart: '2026-11-02', score: 7 }],
    });
    const period = parsePeriod('2026-11', today);
    const c = comparePeriods(periodHeadline(r, period, today), periodHeadline(r, parsePeriod('2026-10', today), today), period);
    expect(c.dailyAverage).toBe(25);
    expect(c.score).toBe(1);
  });

  it('shows nothing without a previous value or for all time', () => {
    const r = rows({ reviews: [{ weekStart: '2026-11-02', score: 7 }] });
    const period = parsePeriod('2026-11', today);
    const c = comparePeriods(periodHeadline(r, period, today), periodHeadline(r, parsePeriod('2026-10', today), today), period);
    expect(c.score).toBeNull();
    expect(c.dailyAverage).toBeNull();
    const all = parsePeriod('all', today);
    expect(comparePeriods(periodHeadline(r, all, today, '2026-11-02'), null, all).score).toBeNull();
  });
});

describe('trend', () => {
  it('has no score for a week without a review', () => {
    const r = rows({ reviews: [{ weekStart: '2026-10-05', score: 8 }] });
    const points = periodTrend(r, parsePeriod('2026-10', today), today);
    expect(points.map((p) => p.score)).toEqual([null, 8, null, null, null]);
  });

  it('marks the current week as so far', () => {
    const points = periodTrend(rows(), parsePeriod('2026-11', today), today);
    expect(points.at(-1)?.bucket.soFar).toBe(true);
  });
});

describe('all time', () => {
  it('starts at the given date and is empty without data', () => {
    const r = rows({ logEntries: [entry('2026-03-14', 60)] });
    const h = headline(r, 'all', '2026-03-14');
    expect(h.minutes).toBe(60);
    expect(h.empty).toBe(false);
    expect(headline(rows(), '2026-10').empty).toBe(true);
  });
});

describe('from first use', () => {
  it('divides the daily average by the days since first use', () => {
    const r = rows({ logEntries: [entry('2026-11-03', 30 * 60)] });
    expect(headline(r, '2026-11', '2026-11-03').dailyAverageMinutes).toBe(5 * 60);
  });

  it('counts the weeks reviewed from the week of first use', () => {
    const reviews = ['2026-10-12', '2026-10-19', '2026-10-26'].map((weekStart) => ({ weekStart, score: 7 }));
    const h = headline(rows({ reviews }), '2026-10', '2026-10-16');
    expect(h.weeks).toBe(3);
    expect(h.reviewedWeeks).toBe(3);
  });

  it('has no trend points before first use', () => {
    const r = rows({ logEntries: [entry('2026-09-10', 60)] });
    const trend = periodTrend(r, parsePeriod('2026', today), today, '2026-09-10');
    expect(trend.map((p) => p.bucket.key)).toEqual(['2026-09', '2026-10', '2026-11']);
  });

  it('has no previous headline when the previous period ends before first use', () => {
    const r = rows({ logEntries: [entry('2026-11-03', 60)] });
    expect(previousHeadline(r, parsePeriod('2026-11', today), today, '2026-11-03')).toBeNull();
    expect(previousHeadline(r, parsePeriod('2026-11', today), today, '2026-10-20')).not.toBeNull();
  });
});
