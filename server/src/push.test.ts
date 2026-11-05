import { describe, expect, it } from 'vitest';
import type { SqlDriver } from '../../src/platform/db/driver.ts';
import { HttpError } from './errors.ts';
import { area, project, task, T10_00, T10_05 } from './fixtures.ts';
import { push } from './push.ts';
import { openServerTestDatabase } from './testing.ts';

async function all(driver: SqlDriver, sql: string) {
  return (await driver.query(sql, [], 'all')).rows;
}

async function refused(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(HttpError);
  return (error as HttpError).status;
}

describe('push', () => {
  it('stores a new row', async () => {
    const driver = await openServerTestDatabase();
    expect(await push(driver, { rows: { projects: [project('p1', T10_00)] } })).toEqual({ stored: 1 });
    expect(await all(driver, 'SELECT id, title FROM projects')).toEqual([['p1', 'Project']]);
  });

  it('stores a newer version', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { projects: [project('p1', T10_00, 'Old')] } });
    expect(await push(driver, { rows: { projects: [project('p1', T10_05, 'New')] } })).toEqual({ stored: 1 });
    expect(await all(driver, 'SELECT title FROM projects')).toEqual([['New']]);
  });

  it('keeps the stored row when the pushed one is older', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { projects: [project('p1', T10_05, 'New')] } });
    expect(await push(driver, { rows: { projects: [project('p1', T10_00, 'Old')] } })).toEqual({ stored: 0 });
    expect(await all(driver, 'SELECT title FROM projects')).toEqual([['New']]);
  });

  it('stores nothing when the same version is pushed twice', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { projects: [project('p1', T10_00)] } });
    expect(await push(driver, { rows: { projects: [project('p1', T10_00)] } })).toEqual({ stored: 0 });
  });

  it('stores a deleted task', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { tasks: [task('t1', T10_00)] } });
    await push(driver, { rows: { tasks: [task('t1', T10_05, null, { deleted_at: T10_05 })] } });
    expect(await all(driver, 'SELECT deleted_at FROM tasks')).toEqual([[T10_05]]);
  });

  it('stores a child before its parent', async () => {
    const driver = await openServerTestDatabase();
    await push(driver, { rows: { tasks: [task('t1', T10_00, 'p1')] } });
    expect(await all(driver, 'SELECT project_id FROM tasks')).toEqual([['p1']]);
    await push(driver, { rows: { projects: [project('p1', T10_00)] } });
    expect(await all(driver, 'SELECT id FROM projects')).toEqual([['p1']]);
  });

  describe('refused pushes', () => {
    it('stores nothing when one row is invalid', async () => {
      const driver = await openServerTestDatabase();
      const broken: Record<string, unknown> = { ...task('t1', T10_00) };
      delete broken.updated_at;
      expect(await refused(push(driver, { rows: { areas: [area('a1', T10_00)], tasks: [broken as never] } }))).toBe(400);
      expect(await all(driver, 'SELECT id FROM areas')).toEqual([]);
    });

    it('refuses a timestamp in another format', async () => {
      const driver = await openServerTestDatabase();
      expect(await refused(push(driver, { rows: { areas: [area('a1', '2026-11-05 10:00')] } }))).toBe(400);
      expect(await all(driver, 'SELECT id FROM areas')).toEqual([]);
    });

    it('refuses an unknown column', async () => {
      const driver = await openServerTestDatabase();
      expect(await refused(push(driver, { rows: { projects: [project('p1', T10_00, 'P', { next_step: 'x' })] } }))).toBe(400);
      expect(await all(driver, 'SELECT id FROM projects')).toEqual([]);
    });

    it('refuses a missing column', async () => {
      const driver = await openServerTestDatabase();
      const row: Record<string, unknown> = { ...project('p1', T10_00) };
      delete row.title;
      expect(await refused(push(driver, { rows: { projects: [row as never] } }))).toBe(400);
    });

    it('refuses the settings table', async () => {
      const driver = await openServerTestDatabase();
      expect(await refused(push(driver, { rows: { settings: [{ key: 'a', value: 'b' }] } }))).toBe(400);
    });

    it('refuses an empty required value', async () => {
      const driver = await openServerTestDatabase();
      const row = { ...project('p1', T10_00), title: null } as never;
      expect(await refused(push(driver, { rows: { projects: [row] } }))).toBe(400);
    });

    it('refuses a value the column does not accept', async () => {
      const driver = await openServerTestDatabase();
      expect(await refused(push(driver, { rows: { projects: [project('p1', T10_00, 'P', { title: { a: 1 } as never })] } }))).toBe(400);
    });

    it('refuses more than 500 rows', async () => {
      const driver = await openServerTestDatabase();
      const rows = Array.from({ length: 501 }, (_, i) => area(`a${i}`, T10_00));
      expect(await refused(push(driver, { rows: { areas: rows } }))).toBe(413);
      expect(await all(driver, 'SELECT id FROM areas')).toEqual([]);
    });
  });
});
