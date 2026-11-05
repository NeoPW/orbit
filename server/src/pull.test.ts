import { describe, expect, it } from 'vitest';
import { area, project, T10_00, T10_05 } from './fixtures.ts';
import { pull } from './pull.ts';
import { push, type WireRow } from './push.ts';
import { openServerTestDatabase } from './testing.ts';

describe('pull', () => {
  it('returns everything, deleted rows included, without a cursor', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { areas: [area('a1', T10_00), area('a2', T10_00), area('a3', T10_00)] } });
    await push(driver, { rows: { projects: [project('p1', T10_00), project('p2', T10_00, 'Gone', { deleted_at: T10_00 })] } });
    const result = await pull(driver, 0);
    expect(result.rows.areas).toHaveLength(3);
    expect(result.rows.projects?.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.rows.projects?.[1]?.deleted_at).toBe(T10_00);
    expect(result.cursor).toBeGreaterThan(0);
    expect(result.more).toBe(false);
  });

  it('returns only changes after the cursor', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { projects: [project('p1', T10_00, 'Old'), project('p2', T10_00)] } });
    const first = await pull(driver, 0);
    await push(driver, { rows: { projects: [project('p1', T10_05, 'Renamed')] } });
    const second = await pull(driver, first.cursor);
    expect(second.rows.projects?.map((p) => p.title)).toEqual(['Renamed']);
    expect(Object.keys(second.rows)).toEqual(['projects']);
  });

  it('does not count an ignored push as a change', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { projects: [project('p1', T10_05, 'New')] } });
    const first = await pull(driver, 0);
    await push(driver, { rows: { projects: [project('p1', T10_00, 'Old')] } });
    const second = await pull(driver, first.cursor);
    expect(second.rows).toEqual({});
    expect(second.cursor).toBe(first.cursor);
  });

  it('pages through 2500 rows without repeating any', async () => {
    const driver = await openServerTestDatabase();
    for (let chunk = 0; chunk < 5; chunk++) {
      const rows = Array.from({ length: 500 }, (_, i) => area(`a${chunk * 500 + i}`, T10_00));
      await push(driver, { rows: { areas: rows } });
    }
    const sizes: number[] = [];
    const more: boolean[] = [];
    const seen = new Set<string>();
    let cursor = 0;
    for (;;) {
      const page = await pull(driver, cursor);
      const rows = page.rows.areas ?? [];
      rows.forEach((r) => seen.add(String(r.id)));
      sizes.push(rows.length);
      more.push(page.more);
      cursor = page.cursor;
      if (!page.more) break;
    }
    expect(sizes).toEqual([1000, 1000, 500]);
    expect(more).toEqual([true, true, false]);
    expect(seen.size).toBe(2500);
  });

  it('returns rows exactly as pushed', async () => {
    const driver = await openServerTestDatabase();
    const base = { created_at: T10_00, updated_at: T10_00, deleted_at: null };
    const goal: WireRow = { id: 'g1', ...base, title: 'Fit', description: '', start_date: '2026-10-01', end_date: null, status: 'active', sort_order: 0, color: 'rose' };
    const measure: WireRow = {
      id: 'm1', ...base, goal_id: 'g1', title: 'Run', description: '', measure_type: 'numeric',
      start_value: 0, target_value: 100, current_value: 5, unit: 'km', step: 5, habit_id: null, sort_order: 0,
    };
    await push(driver, { rows: { goals: [goal], measures: [measure] } });
    const { rows } = await pull(driver, 0);
    expect(rows.goals).toEqual([goal]);
    expect(rows.measures).toEqual([measure]);
  });
});
