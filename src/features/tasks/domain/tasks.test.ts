import { describe, expect, it } from 'vitest';
import {
  hasHomeOrder,
  hasManualOrder,
  nextStepOutcome,
  parseNewTaskTitle,
  positionBetween,
  positionTooClose,
  sortOpenTasks,
  sortTodo,
} from './tasks.ts';

describe('sortOpenTasks', () => {
  it('orders by time added, oldest first', () => {
    const a = { name: 'A', createdAt: '2' };
    const b = { name: 'B', createdAt: '3' };
    const c = { name: 'C', createdAt: '1' };
    expect(sortOpenTasks([a, b, c]).map((x) => x.name)).toEqual(['C', 'A', 'B']);
  });
  it('puts next steps first when asked', () => {
    const a = { name: 'A', createdAt: '1' };
    const b = { name: 'B', createdAt: '2', isNextStep: true };
    expect(sortOpenTasks([a, b], { nextStepsFirst: true }).map((x) => x.name)).toEqual(['B', 'A']);
  });
});

describe('manual task order', () => {
  const a = { name: 'A', createdAt: '1', sortOrder: null as number | null };
  const b = { name: 'B', createdAt: '2', sortOrder: null as number | null };
  const c = { name: 'C', createdAt: '3', sortOrder: null as number | null };

  it('keeps the time-added order until the list is reordered', () => {
    expect(sortOpenTasks([a, b, c]).map((x) => x.name)).toEqual(['A', 'B', 'C']);
    expect(hasManualOrder([a, b, c])).toBe(false);
  });

  it('puts positioned tasks first, by position', () => {
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 2 }, { ...c, sortOrder: 1 }];
    expect(sortOpenTasks(list).map((x) => x.name)).toEqual(['A', 'C', 'B']);
    expect(hasManualOrder(list)).toBe(true);
  });

  it('lists a new task after the ordered ones', () => {
    const d = { name: 'D', createdAt: '4', sortOrder: null };
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 1 }, { ...c, sortOrder: 2 }, d];
    expect(sortOpenTasks(list).map((x) => x.name)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('keeps next steps on top of the manual order', () => {
    const list = [{ ...a, sortOrder: 0 }, { ...b, sortOrder: 1, isNextStep: true }];
    expect(sortOpenTasks(list, { nextStepsFirst: true }).map((x) => x.name)).toEqual(['B', 'A']);
  });
});

describe('To do order', () => {
  const a = { name: 'A', createdAt: '1', homePosition: null as number | null };
  const b = { name: 'B', createdAt: '2', homePosition: null as number | null };
  const c = { name: 'C', createdAt: '3', homePosition: null as number | null };

  it('lists by time added until To do is reordered', () => {
    expect(sortTodo([c, a, b]).map((x) => x.name)).toEqual(['A', 'B', 'C']);
    expect(hasHomeOrder([a, b, c])).toBe(false);
  });

  it('puts positioned tasks first, by position', () => {
    const list = [{ ...a, homePosition: 2 }, { ...b, homePosition: 0 }, { ...c, homePosition: 1 }];
    expect(sortTodo(list).map((x) => x.name)).toEqual(['B', 'C', 'A']);
    expect(hasHomeOrder(list)).toBe(true);
  });

  it('lists a new task after the ordered ones', () => {
    const d = { name: 'D', createdAt: '0', homePosition: null };
    const list = [d, { ...a, homePosition: 1 }, { ...b, homePosition: 0 }];
    expect(sortTodo(list).map((x) => x.name)).toEqual(['B', 'A', 'D']);
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

describe('parseNewTaskTitle', () => {
  const projects = [
    { id: 'a', title: 'Chapter 4: Evaluation' },
    { id: 'b', title: 'Portfolio site' },
    { id: 'c', title: 'Portfolio redesign' },
  ];
  it('assigns the only project starting with the text', () => {
    expect(parseNewTaskTitle('Draft intro # chap', projects)).toEqual({ title: 'Draft intro', projectId: 'a' });
  });
  it('prefers an exact name over a prefix', () => {
    expect(parseNewTaskTitle('Update CV # portfolio site', projects)).toEqual({ title: 'Update CV', projectId: 'b' });
  });
  it('reports an unknown or ambiguous project', () => {
    expect(parseNewTaskTitle('Draft intro # garden', projects)).toEqual({ error: 'No project named garden' });
    expect(parseNewTaskTitle('Fix issue #12', projects)).toEqual({ error: 'No project named 12' });
    expect(parseNewTaskTitle('Draft # portf', projects)).toEqual({ error: 'No project named portf' });
  });
  it('keeps a title without #', () => {
    expect(parseNewTaskTitle('  Tax return ', projects)).toEqual({ title: 'Tax return', projectId: null });
  });
});
