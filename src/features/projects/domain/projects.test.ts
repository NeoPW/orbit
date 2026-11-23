import { describe, expect, it } from 'vitest';
import { effectiveDeadline, sortProjects } from './projects.ts';

const p = (title: string, createdAt: string, deadline: string | null = null, goalEnd: string | null = null) => ({
  title,
  createdAt,
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

describe('project order', () => {
  it('puts the earliest effective deadline first, none last', () => {
    const list = sortProjects([p('A', '1'), p('B', '2', '2027-03-01'), p('C', '3', null, '2026-12-01')]);
    expect(list.map((x) => x.title)).toEqual(['C', 'B', 'A']);
  });
  it('breaks a tie by time added, oldest first', () => {
    const list = sortProjects([p('B', '2', '2026-11-01'), p('A', '3', '2026-11-01'), p('C', '1')]);
    expect(list.map((x) => x.title)).toEqual(['B', 'A', 'C']);
  });
});
