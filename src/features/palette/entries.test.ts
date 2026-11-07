import { describe, expect, it } from 'vitest';
import { buildEntries, filterEntries, type PaletteData } from './entries.ts';

const data: PaletteData = {
  projects: [
    { id: 'p1', title: 'Thesis', active: true, color: 'var(--pc1)' },
    { id: 'p2', title: 'Garden redesign', active: false, color: null },
  ],
  goals: [{ id: 'g1', title: 'Get fit' }],
  openTasks: [{ id: 't1', title: 'Rerun benchmarks', color: 'var(--pc1)' }],
  activeHabits: [{ id: 'h1', title: 'Run 5 km', color: null }],
  themes: [
    { id: 'slate', name: 'Slate' },
    { id: 'forest', name: 'Forest' },
  ],
  session: null,
  syncConnected: false,
};
const labels = (query: string, d: PaletteData = data) => filterEntries(buildEntries(d), query).map((e) => e.label);

describe('command palette entries', () => {
  it('filters by every typed word, ignoring case', () => {
    expect(labels('new pro')).toContain('New project');
    expect(labels('new pro')).not.toContain('New task');
  });

  it('offers creating, logging work and the screens with their shortcuts', () => {
    const entries = buildEntries(data);
    expect(entries.find((e) => e.label === 'New task')).toMatchObject({ kind: 'Create', shortcut: 'new-task', command: { sheet: 'task' } });
    expect(entries.find((e) => e.label === 'Log work')?.command).toEqual({ type: 'sheet', sheet: 'log' });
    expect(entries.find((e) => e.label === 'New goal')?.command).toEqual({ type: 'sheet', sheet: 'goal' });
    expect(entries.find((e) => e.label === 'Plan')?.shortcut).toBe('go-plan');
  });

  it('goes to projects, goals and open tasks by title', () => {
    const thesis = filterEntries(buildEntries(data), 'thesis').find((e) => e.kind === 'Go to');
    expect(thesis?.command).toEqual({ type: 'page', page: 'project', id: 'p1' });
    expect(labels('fit')).toContain('Get fit');
    expect(labels('garden')).toContain('Garden redesign');
  });

  it('offers focus on open tasks, active habits and active projects only', () => {
    expect(labels('bench')).toContain('Focus: Rerun benchmarks');
    expect(labels('run 5')).toContain('Focus: Run 5 km');
    expect(labels('thesis')).toContain('Focus: Thesis');
    expect(labels('garden')).not.toContain('Focus: Garden redesign');
  });

  it('offers the typed text as a focus entry, last', () => {
    const entries = filterEntries(buildEntries(data), 'draft intro # thesis');
    expect(entries.at(-1)).toMatchObject({
      label: 'Focus: draft intro # thesis',
      command: { type: 'focus-text', text: 'draft intro # thesis' },
    });
    expect(filterEntries(buildEntries(data), '').some((e) => e.command.type === 'focus-text')).toBe(false);
  });

  it('shows session entries only with a session', () => {
    expect(labels('pause')).not.toContain('Pause');
    expect(labels('pause', { ...data, session: { paused: false } })).toContain('Pause');
    expect(labels('resume', { ...data, session: { paused: true } })).toContain('Resume');
    expect(labels('limit', { ...data, session: { paused: false } })).toContain('Set time limit');
  });

  it('switches themes and syncs only when connected', () => {
    expect(labels('forest')).toContain('Theme: Forest');
    expect(labels('sync')).not.toContain('Sync now');
    expect(labels('sync', { ...data, syncConnected: true })).toContain('Sync now');
  });

  it('shows at most 50 entries', () => {
    const many = { ...data, openTasks: Array.from({ length: 80 }, (_, i) => ({ id: `t${i}`, title: `Task ${i}`, color: null })) };
    expect(filterEntries(buildEntries(many), 'task')).toHaveLength(50);
    expect(filterEntries(buildEntries(many), '')).toHaveLength(50);
  });
});
