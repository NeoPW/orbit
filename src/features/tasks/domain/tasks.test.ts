import { describe, expect, it } from 'vitest';
import { effectiveImportance, nextStepOutcome, sortByRank, sortOpenTasks, taskRank, type RankInput } from './tasks.ts';

const today = '2026-10-05';
const t = (over: Partial<RankInput> & { name?: string }): RankInput & { name?: string } => ({
  importance: null,
  dueDate: null,
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});

describe('effectiveImportance', () => {
  it('uses the own importance', () => {
    expect(effectiveImportance({ importance: 5, projectImportance: 2 })).toEqual({ value: 5, inherited: false });
  });
  it('inherits from the project', () => {
    expect(effectiveImportance({ importance: null, projectImportance: 4 })).toEqual({ value: 4, inherited: true });
  });
  it('defaults to 3 when standalone', () => {
    expect(effectiveImportance({ importance: null })).toEqual({ value: 3, inherited: true });
  });
});

describe('taskRank', () => {
  it('ranks an overdue low-importance task before an undated important one', () => {
    const a = t({ name: 'A', importance: 2, dueDate: '2026-10-01' });
    const b = t({ name: 'B', importance: 5 });
    expect(taskRank(a, today)).toBe(10);
    expect(taskRank(b, today)).toBe(5);
    expect(sortByRank([b, a], today).map((x) => x.name)).toEqual(['A', 'B']);
  });
  it('inherits importance and urgency from the project', () => {
    expect(taskRank(t({ projectImportance: 4, projectDeadline: '2026-10-07' }), today)).toBe(16);
  });
  it('inherits urgency from the goal end of the project', () => {
    expect(taskRank(t({ projectImportance: 4, projectGoalEnd: '2026-10-07' }), today)).toBe(16);
  });
  it('uses the end date of the goal a task is assigned to', () => {
    expect(taskRank(t({ goalEnd: '2026-10-25' }), today)).toBe(6);
  });
  it('breaks ties by due date, then oldest first', () => {
    const dated = t({ name: 'dated', dueDate: '2027-06-01' });
    const none = t({ name: 'none' });
    expect(sortByRank([none, dated], today).map((x) => x.name)).toEqual(['dated', 'none']);
    const older = t({ name: 'older', createdAt: '2026-09-01T00:00:00Z' });
    expect(sortByRank([none, older], today).map((x) => x.name)).toEqual(['older', 'none']);
  });
});

describe('sortOpenTasks', () => {
  it('orders by due date then creation', () => {
    const a = { name: 'A', dueDate: null, createdAt: '1' };
    const b = { name: 'B', dueDate: '2026-10-20', createdAt: '2' };
    const c = { name: 'C', dueDate: '2026-10-10', createdAt: '3' };
    expect(sortOpenTasks([a, b, c]).map((x) => x.name)).toEqual(['C', 'B', 'A']);
  });
  it('puts next steps first when asked', () => {
    const a = { name: 'A', dueDate: '2026-10-10', createdAt: '1' };
    const b = { name: 'B', dueDate: null, createdAt: '2', isNextStep: true };
    expect(sortOpenTasks([a, b], { nextStepsFirst: true }).map((x) => x.name)).toEqual(['B', 'A']);
  });
});

describe('nextStepOutcome', () => {
  const task = { id: 'a', projectId: 'p', isNextStep: true };
  it('asks for the last open next step', () => {
    expect(nextStepOutcome(task, [{ id: 'a' }])).toBe('ask');
  });
  it('completes directly when other next steps remain', () => {
    expect(nextStepOutcome(task, [{ id: 'a' }, { id: 'b' }])).toBe('direct');
  });
  it('completes directly for tasks that are not next steps or have no project', () => {
    expect(nextStepOutcome({ ...task, isNextStep: false }, [])).toBe('direct');
    expect(nextStepOutcome({ ...task, projectId: null }, [{ id: 'a' }])).toBe('direct');
  });
});
