import { describe, expect, it } from 'vitest';
import { parsePeriod } from './period.ts';
import { formatTimeToDone, taskFigures, taskTrend } from './task-stats.ts';

const today = '2026-11-08';
const period = (key: string) => parsePeriod(key, today);
const task = (created: string, completed: string | null, over: object = {}) => ({
  status: completed ? 'done' : 'open',
  createdAt: created,
  completedAt: completed,
  deletedAt: null,
  ...over,
});
const DAY = (n: number) => `2026-10-${String(n).padStart(2, '0')}T10:00:00`;

describe('task figures', () => {
  it('counts completed and created tasks in the period', () => {
    const tasks = [
      task('2026-09-20T10:00:00', DAY(5)),
      task(DAY(1), DAY(8)),
      task(DAY(2), null),
      task('2026-09-01T10:00:00', null),
      task(DAY(3), DAY(9), { deletedAt: '2026-10-10T10:00:00' }),
    ];
    const f = taskFigures(tasks, period('2026-10'), today);
    expect(f.completed).toBe(2);
    expect(f.created).toBe(2);
  });

  it('takes the median time to done', () => {
    const tasks = [task('2026-10-04T10:00:00', DAY(5)), task('2026-10-02T10:00:00', DAY(5)), task('2026-09-26T10:00:00', DAY(5))];
    expect(taskFigures(tasks, period('2026-10'), today).medianMinutes).toBe(3 * 1440);
  });

  it('averages the middle two of an even count', () => {
    const tasks = [task('2026-10-03T10:00:00', DAY(5)), task('2026-10-01T10:00:00', DAY(5))];
    expect(formatTimeToDone(taskFigures(tasks, period('2026-10'), today).medianMinutes ?? 0)).toBe('3 days');
  });

  it('reads hours under a day', () => {
    const tasks = [task('2026-10-05T05:00:00', '2026-10-05T10:00:00')];
    expect(formatTimeToDone(taskFigures(tasks, period('2026-10'), today).medianMinutes ?? 0)).toBe('5 h');
  });

  it('has no median without a completed task', () => {
    const f = taskFigures([task(DAY(1), null)], period('2026-10'), today);
    expect(f.completed).toBe(0);
    expect(f.medianMinutes).toBeNull();
  });
});

describe('task trend', () => {
  it('has a point for each of the 13 weeks of a quarter', () => {
    const points = taskTrend([task('2026-07-01T10:00:00', '2026-07-08T10:00:00')], period('2026-Q3'), today);
    expect(points).toHaveLength(13);
    expect(points.reduce((sum, p) => sum + p.completed, 0)).toBe(1);
  });
});
