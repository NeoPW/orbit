import { describe, expect, it } from 'vitest';
import {
  hasManualOrder,
  nextStepOutcome,
  positionBetween,
  positionTooClose,
  sortOpenTasks,
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
