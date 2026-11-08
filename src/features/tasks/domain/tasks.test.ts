import { describe, expect, it } from 'vitest';
import {
  applyProjectOrder,
  compareByRank,
  effectiveImportance,
  hasManualOrder,
  nextStepOutcome,
  positionBetween,
  positionTooClose,
  sortOpenTasks,
  taskRank,
  type RankInput,
} from './tasks.ts';

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
    expect([b, a].sort(compareByRank(today)).map((x) => x.name)).toEqual(['A', 'B']);
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
    expect([none, dated].sort(compareByRank(today)).map((x) => x.name)).toEqual(['dated', 'none']);
    const older = t({ name: 'older', createdAt: '2026-09-01T00:00:00Z' });
    expect([none, older].sort(compareByRank(today)).map((x) => x.name)).toEqual(['older', 'none']);
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

describe('manual task order', () => {
  const a = { name: 'A', dueDate: null, createdAt: '1', sortOrder: null as number | null };
  const b = { name: 'B', dueDate: '2026-10-20', createdAt: '2', sortOrder: null as number | null };
  const c = { name: 'C', dueDate: '2026-10-10', createdAt: '3', sortOrder: null as number | null };

  it('keeps the due-date order until the list is reordered', () => {
    expect(sortOpenTasks([a, b, c]).map((x) => x.name)).toEqual(['C', 'B', 'A']);
    expect(hasManualOrder([a, b, c])).toBe(false);
  });

  it('puts positioned tasks first, by position', () => {
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 2 }, { ...c, sortOrder: 1 }];
    expect(sortOpenTasks(list).map((x) => x.name)).toEqual(['A', 'C', 'B']);
    expect(hasManualOrder(list)).toBe(true);
  });

  it('lists a new task after the ordered ones, by due date', () => {
    const d = { name: 'D', dueDate: '2026-10-01', createdAt: '4', sortOrder: null };
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 1 }, { ...c, sortOrder: 2 }, d];
    expect(sortOpenTasks(list).map((x) => x.name)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('keeps next steps on top of the manual order', () => {
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 1, isNextStep: true }];
    expect(sortOpenTasks(list, { nextStepsFirst: true }).map((x) => x.name)).toEqual(['B', 'A']);
  });
});

describe('positions', () => {
  it('finds a position between neighbours and at the ends', () => {
    expect(positionBetween(null, null)).toBe(0);
    expect(positionBetween(1, 3)).toBe(2);
    expect(positionBetween(null, 4)).toBe(3);
    expect(positionBetween(4, null)).toBe(5);
  });

  it('notices when the gap is too small to halve again', () => {
    expect(positionTooClose(1.5, 1, 2)).toBe(false);
    expect(positionTooClose(1 + 1e-9, 1, 2)).toBe(true);
  });
});

describe('project order as the Home tie-break', () => {
  const info = (x: { projectId: string; sortOrder: number | null; importance?: number | null; createdAt?: string }): RankInput & { projectId: string; sortOrder: number | null } => ({
    importance: x.importance ?? 3,
    dueDate: null,
    createdAt: x.createdAt ?? '2026-10-01T00:00:00Z',
    projectId: x.projectId,
    sortOrder: x.sortOrder,
  });
  const intro = { name: 'Write intro', projectId: 'p', sortOrder: 1, createdAt: '2026-10-01T00:00:00Z' };
  const venue = { name: 'Book venue', projectId: 'p', sortOrder: 0, createdAt: '2026-10-02T00:00:00Z' };

  it('lets the project order decide among tied tasks of one project', () => {
    const sorted = [intro, venue];
    expect(applyProjectOrder(sorted, today, info).map((x) => x.name)).toEqual(['Book venue', 'Write intro']);
  });

  it('leaves the rank in charge', () => {
    const high = { ...intro, importance: 5 };
    const sorted = [high, venue].map((x) => ({ ...x, ...info(x) })).sort(compareByRank(today));
    expect(applyProjectOrder(sorted, today, info).map((x) => x.name)).toEqual(['Write intro', 'Book venue']);
  });

  it('keeps the places of other projects', () => {
    const other = { name: 'Other', projectId: 'q', sortOrder: null, createdAt: '2026-10-01T12:00:00Z' };
    const sorted = [intro, other, venue];
    expect(applyProjectOrder(sorted, today, info).map((x) => x.name)).toEqual(['Book venue', 'Other', 'Write intro']);
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
