import { describe, expect, it } from 'vitest';
import { formatDuration, occurrenceTime, parseDuration, recentFirst, workOnGoal, type GoalWorkEntry, type WorkLinks } from './work-log.ts';

describe('duration', () => {
  it('formats', () => {
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('rejects an invalid duration', () => {
    for (const bad of ['0', '1441', '-5', '1.5', 'abc']) expect(parseDuration(bad).ok).toBe(false);
    expect(parseDuration('')).toEqual({ ok: true, minutes: null });
    expect(parseDuration('1440')).toEqual({ ok: true, minutes: 1440 });
  });
});

describe('recent first', () => {
  it('orders B (yesterday), A (last week), C (never)', () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C' },
    ];
    const last = new Map([
      ['a', '2026-10-29T10:00:00Z'],
      ['b', '2026-11-04T10:00:00Z'],
    ]);
    expect(recentFirst(items, last).map((i) => i.title)).toEqual(['B', 'A', 'C']);
  });
});

describe('work on a goal', () => {
  const entry = (over: Partial<GoalWorkEntry>): GoalWorkEntry => ({
    projectId: null,
    goalId: null,
    taskId: null,
    occurredAt: '2026-11-03T10:00:00Z',
    durationMinutes: 30,
    ...over,
  });
  const week = { from: '2026-11-02T00:00:00Z', to: '2026-11-09T00:00:00Z' };
  const links = (over: Partial<WorkLinks> = {}): WorkLinks => ({ projectGoals: new Map(), tasks: new Map(), ...over });

  it('counts work through a project', () => {
    const l = links({ projectGoals: new Map([['p1', 'g1']]) });
    const result = workOnGoal([entry({ projectId: 'p1' }), entry({ projectId: 'p1' }), entry({ projectId: 'p2' })], 'g1', l, week);
    expect(result.week).toEqual({ count: 2, minutes: 60 });
  });

  it('counts work on an assigned task', () => {
    const l = links({ tasks: new Map([['t1', { projectId: null, goalId: 'g1' }]]) });
    const result = workOnGoal([entry({ taskId: 't1', durationMinutes: 45 })], 'g1', l, week);
    expect(result.total).toEqual({ count: 1, minutes: 45 });
  });

  it('counts a task of a project of the goal', () => {
    const l = links({ projectGoals: new Map([['p1', 'g1']]), tasks: new Map([['t1', { projectId: 'p1', goalId: null }]]) });
    expect(workOnGoal([entry({ taskId: 't1' })], 'g1', l, week).total.count).toBe(1);
  });

  it('counts a project linked later in the total, not in this week', () => {
    const entries = [1, 2, 3].map((i) => entry({ projectId: 'p1', occurredAt: `2026-10-1${i}T10:00:00Z` }));
    const result = workOnGoal(entries, 'g1', links({ projectGoals: new Map([['p1', 'g1']]) }), week);
    expect(result.total.count).toBe(3);
    expect(result.week.count).toBe(0);
    expect(result.entries[0]?.occurredAt).toBe('2026-10-13T10:00:00Z');
  });
});

describe('occurrenceTime', () => {
  const now = new Date(2026, 10, 6, 15, 0);
  const at = (h: number, m: number) => new Date(2026, 10, 6, h, m);

  it('is now without a start time', () => {
    expect(occurrenceTime(null, 45, now)).toEqual({ ok: true, at: now });
    expect(occurrenceTime('', 45, now)).toEqual({ ok: true, at: now });
  });

  it('ends at the start plus the duration', () => {
    expect(occurrenceTime('13:00', 90, now)).toEqual({ ok: true, at: at(14, 30) });
  });

  it('is the start itself without a duration', () => {
    expect(occurrenceTime('13:00', null, now)).toEqual({ ok: true, at: at(13, 0) });
  });

  it('rejects a start in the future', () => {
    expect(occurrenceTime('16:00', 30, now).ok).toBe(false);
    expect(occurrenceTime('15:00', 30, now).ok).toBe(true);
  });
});
