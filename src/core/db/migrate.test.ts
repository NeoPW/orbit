import { describe, expect, it } from 'vitest';
import { createNodeDriver } from '../../platform/db/node.ts';
import type { SqlDriver } from '../../platform/db/driver.ts';
import { migrate } from './migrate.ts';
import { createFields } from './records.ts';
import { habitChecks, notes, projects, weeklyReviews } from './schema.ts';
import { openTestDatabase } from './testing.ts';

const clock = () => new Date('2026-11-05T10:00:00.000Z');

async function scalar(driver: SqlDriver, sql: string) {
  return (await driver.query(sql, [], 'get')).rows[0]?.[0];
}

const EXTRA_OK = {
  version: 2,
  sql: 'ALTER TABLE `areas` ADD `icon` text;--> statement-breakpoint\nCREATE TABLE `extra` (`id` text);',
};
const EXTRA_FAILING = {
  version: 2,
  sql: 'CREATE TABLE `half` (`id` text);--> statement-breakpoint\nINSERT INTO `no_such_table` VALUES (1);',
};

describe('migrations', () => {
  it('creates 12 entity tables and settings on a fresh install at version 1', async () => {
    const { driver, schemaVersion } = await openTestDatabase();
    expect(schemaVersion).toBe(1);
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(1);
    const tables = await driver.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      [],
      'all',
    );
    const names = tables.rows.map((r) => r[0]);
    expect(names).toHaveLength(13);
    expect(names).toContain('settings');
  });

  it('runs nothing when already at the current version', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await driver.query('CREATE TABLE marker (x)', [], 'run');
    const result = await migrate(driver);
    expect(result).toEqual({ fromVersion: 1, schemaVersion: 1 });
  });

  it('upgrades with a newer migration and keeps existing rows', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await driver.query(
      "INSERT INTO areas (id, created_at, updated_at, name, color) VALUES ('a', 't', 't', 'Job', '#000000')",
      [],
      'run',
    );
    const result = await migrate(driver, [
      { version: 1, sql: 'SELECT 1' },
      EXTRA_OK,
    ]);
    expect(result).toEqual({ fromVersion: 1, schemaVersion: 2 });
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(2);
    expect(await scalar(driver, "SELECT name FROM areas WHERE id = 'a'")).toBe('Job');
    expect(await scalar(driver, 'SELECT count(*) FROM extra')).toBe(0);
  });

  it('leaves no partial changes and the old version when a migration fails', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await expect(migrate(driver, [{ version: 1, sql: 'SELECT 1' }, EXTRA_FAILING])).rejects.toThrow();
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(1);
    expect(await scalar(driver, "SELECT count(*) FROM sqlite_master WHERE name = 'half'")).toBe(0);
  });

  it('rolls back user_version itself with the batch', async () => {
    const driver = createNodeDriver();
    await expect(
      driver.batch([
        { sql: 'PRAGMA user_version = 5', params: [], method: 'run' },
        { sql: 'INSERT INTO nope VALUES (1)', params: [], method: 'run' },
      ]),
    ).rejects.toThrow();
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(0);
  });
});

describe('schema constraints', () => {
  it('rejects a second habit check for the same habit and date', async () => {
    const { db } = await openTestDatabase();
    const row = { habitId: 'h', date: '2026-11-05' };
    await db.insert(habitChecks).values({ ...createFields(clock), ...row });
    await expect(db.insert(habitChecks).values({ ...createFields(clock), ...row })).rejects.toThrow();
  });

  it('rejects a second weekly review for the same week', async () => {
    const { db } = await openTestDatabase();
    const row = { weekStart: '2026-11-02' };
    await db.insert(weeklyReviews).values({ ...createFields(clock), ...row });
    await expect(db.insert(weeklyReviews).values({ ...createFields(clock), ...row })).rejects.toThrow();
  });

  it('rejects a second note for the same target and week', async () => {
    const { db } = await openTestDatabase();
    const row = { targetType: 'project', targetId: 'p', weekStart: '2026-11-02' } as const;
    await db.insert(notes).values({ ...createFields(clock), ...row });
    await expect(db.insert(notes).values({ ...createFields(clock), ...row })).rejects.toThrow();
  });

  it('stores a backlog project status as text', async () => {
    const { db, driver } = await openTestDatabase();
    await db.insert(projects).values({ ...createFields(clock, 'p'), title: 'P', status: 'backlog' });
    expect(await scalar(driver, "SELECT status FROM projects WHERE id = 'p'")).toBe('backlog');
  });
});
