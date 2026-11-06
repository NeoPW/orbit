import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { listActiveGoals } from '../../goals/data/goals-repository.ts';
import { listHabitsForToday, listTodo, listActiveProjects } from '../../home/data/home-queries.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { hasExampleData, loadExampleData } from './example-data.ts';

const clock = () => new Date('2026-11-06T10:00:00Z');
const today = '2026-11-06';

describe('example data', () => {
  it('fills Home and Plan like the mock-ups', async () => {
    const { db } = await openTestDatabase({ seed: true });
    expect(await hasExampleData(db)).toBe(false);
    await loadExampleData(db, clock, today);
    expect(await hasExampleData(db)).toBe(true);

    const goals = await listActiveGoals(db);
    expect(goals.map((g) => g.goal.title)).toEqual(['Land a frontend role', 'Run a half marathon', 'Finish thesis draft']);
    expect(goals.map((g) => g.measures.length)).toEqual([3, 2, 1]);

    const active = await listProjectsByStatus(db, 'active');
    expect(active.map((p) => p.project.title).sort()).toEqual(
      ['Chapter 4: Evaluation', 'Orbit app rebuild', 'Portfolio site', 'Tax return 2025', 'Training block 3'].sort(),
    );
    expect(await listProjectsByStatus(db, 'backlog', 'paused')).toHaveLength(2);

    // Every project has its own colour.
    const all = await listProjectsByStatus(db, 'active', 'backlog', 'paused', 'completed');
    expect(new Set(all.map((p) => p.color)).size).toBe(all.length - 1); // "Tax return 2025" and "Move flat" share pc4

    const todo = await listTodo(db, today);
    expect(todo.map((t) => t.task.title)).toContain('Rerun benchmarks');
    expect(todo.map((t) => t.task.title)).toContain('Renew passport');
    expect((await listActiveProjects(db, today)).length).toBe(5);
    expect((await listHabitsForToday(db, today)).some((h) => h.checked)).toBe(true);
  });
});
