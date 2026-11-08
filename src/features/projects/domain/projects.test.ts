import { describe, expect, it } from 'vitest';
import { compareForPlan, effectiveDeadline, projectScore, sortByScore, urgency } from './projects.ts';

const today = '2026-10-05';
const p = (title: string, importance: number, deadline: string | null = null, goalEnd: string | null = null) => ({
  title,
  importance,
  deadline,
  goalEnd,
});

describe('effectiveDeadline', () => {
  it('prefers the own deadline', () => {
    expect(effectiveDeadline({ deadline: '2026-10-20', goalEnd: '2026-12-31' })).toEqual({ date: '2026-10-20', inherited: false });
  });
  it('inherits the goal end', () => {
    expect(effectiveDeadline({ deadline: null, goalEnd: '2026-12-31' })).toEqual({ date: '2026-12-31', inherited: true });
  });
  it('is none without either', () => {
    expect(effectiveDeadline({ deadline: null, goalEnd: null })).toBeNull();
  });
});

describe('urgency', () => {
  it('is 5 when overdue and 4 when due today', () => {
    expect(urgency('2026-10-04', today)).toBe(5);
    expect(urgency(today, today)).toBe(4);
  });
  it('has the boundaries 3, 4, 7, 8, 30 and 31 days', () => {
    const dates = ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-11-04', '2026-11-05'];
    expect(dates.map((d) => urgency(d, today))).toEqual([4, 3, 3, 2, 2, 1]);
  });
  it('is 1 without deadline', () => {
    expect(urgency(null, today)).toBe(1);
  });
  it('ignores task due dates (score only uses the project deadline)', () => {
    expect(projectScore(p('A', 3), today)).toBe(3);
  });
});

describe('ordering', () => {
  it('score beats importance', () => {
    const list = sortByScore([p('A', 5), p('B', 2, '2026-10-01')], today);
    expect(list.map((x) => x.title)).toEqual(['B', 'A']);
  });
  it('breaks a score tie by deadline, none last', () => {
    // importance 4 x urgency 1 (far deadline) = 4; importance 4 x urgency 1 (none) = 4
    const list = sortByScore([p('A', 4), p('B', 4, '2027-03-01')], today);
    expect(list.map((x) => x.title)).toEqual(['B', 'A']);
  });
  it('orders Plan by importance, deadline, title', () => {
    const list = [p('C', 3), p('A', 3, '2026-11-01'), p('B', 5)].sort(compareForPlan);
    expect(list.map((x) => x.title)).toEqual(['B', 'A', 'C']);
  });
});
