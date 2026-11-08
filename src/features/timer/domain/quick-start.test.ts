import { describe, expect, it } from 'vitest';
import { matchTasks, parseQuickStart, quickStartPlan, resolveProject } from './quick-start.ts';

const projects = [
  { id: 'p1', title: 'Chapter 4: Evaluation' },
  { id: 'p2', title: 'Portfolio site' },
  { id: 'p3', title: 'Orbit app rebuild' },
  { id: 'p4', title: 'Orbit docs' },
];
const tasks = [
  { id: 't1', title: 'Rerun benchmarks', projectId: 'p1' },
  { id: 't2', title: 'Call the bank', projectId: null },
];

describe('quick start', () => {
  it('splits at the last #', () => {
    expect(parseQuickStart('draft intro # Thesis')).toEqual({ title: 'draft intro', projectQuery: 'Thesis', hasHash: true });
    expect(parseQuickStart('fix #12 # Orbit')).toMatchObject({ title: 'fix #12', projectQuery: 'Orbit' });
    expect(parseQuickStart('plain')).toMatchObject({ title: 'plain', projectQuery: null });
  });

  it('suggests tasks containing the text, prefix matches first', () => {
    const list = [...tasks, { id: 't3', title: 'Benchmark report', projectId: null }];
    expect(matchTasks('bench', list).map((t) => t.id)).toEqual(['t3', 't1']);
    expect(matchTasks('', list)).toEqual([]);
  });

  it('resolves a project by exact name, else a unique prefix', () => {
    expect(resolveProject('portfolio SITE', projects)?.id).toBe('p2');
    expect(resolveProject('chap', projects)?.id).toBe('p1');
    expect(resolveProject('orbit', projects)).toBeNull();
    expect(resolveProject('garden', projects)).toBeNull();
  });

  it('plans a new task in a project', () => {
    expect(quickStartPlan('implement new orbit feature # Orbit app rebuild', tasks, projects)).toEqual({
      kind: 'new',
      title: 'implement new orbit feature',
      projectId: 'p3',
    });
    expect(quickStartPlan('draft intro # chap', tasks, projects)).toEqual({ kind: 'new', title: 'draft intro', projectId: 'p1' });
  });

  it('plans a standalone task, an existing task, a project and errors', () => {
    expect(quickStartPlan('Write email', tasks, projects)).toEqual({ kind: 'new', title: 'Write email', projectId: null });
    expect(quickStartPlan('rerun benchmarks', tasks, projects)).toEqual({ kind: 'task', taskId: 't1' });
    expect(quickStartPlan('# Portfolio', tasks, projects)).toEqual({ kind: 'project', projectId: 'p2' });
    expect(quickStartPlan('draft intro # garden', tasks, projects)).toEqual({ kind: 'error', message: 'No project named garden' });
    expect(quickStartPlan('  ', tasks, projects)).toEqual({ kind: 'empty' });
  });

  it('plans a habit by its title, and prefers a task of the same name', () => {
    const habits = [{ id: 'h1', title: 'Run 5 km', projectId: 'p1', kind: 'habit' as const }];
    expect(quickStartPlan('run 5 km', [...tasks, ...habits], projects)).toEqual({ kind: 'habit', habitId: 'h1' });
    const both = [...habits, { id: 't9', title: 'Run 5 km', projectId: null }];
    expect(quickStartPlan('Run 5 km', both, projects)).toEqual({ kind: 'task', taskId: 't9' });
  });

  it('suggests habits among the tasks', () => {
    const list = [...tasks, { id: 'h1', title: 'Run 5 km', projectId: null, kind: 'habit' as const }];
    expect(matchTasks('run 5', list).map((t) => t.id)).toEqual(['h1']);
  });

  it('starts on a project typed by its exact name, without #', () => {
    expect(quickStartPlan('portfolio site', tasks, projects)).toEqual({ kind: 'project', projectId: 'p2' });
    expect(quickStartPlan('portfolio', tasks, projects)).toEqual({ kind: 'new', title: 'portfolio', projectId: null });
  });

  it('prefers an open task over a project of the same name', () => {
    const same = [...tasks, { id: 't9', title: 'Portfolio site', projectId: null }];
    expect(quickStartPlan('Portfolio site', same, projects)).toEqual({ kind: 'task', taskId: 't9' });
  });
});
