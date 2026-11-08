import { describe, expect, it } from 'vitest';
import { createNodeDriver } from '../../platform/db/node.ts';
import type { SqlDriver } from '../../platform/db/driver.ts';
import { migrate } from './migrate.ts';
import { createFields } from './records.ts';
import { habitChecks, notes, projects, weeklyReviews } from './schema.ts';
import { openTestDatabase } from './testing.ts';
import { SCHEMA_VERSION } from './version.ts';

function bundledMigrationsForTest() {
  const files = import.meta.glob('../../../drizzle/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  return Object.entries(files)
    .map(([path, sql]) => ({ version: Number(/(\d+)_[^/]*\.sql$/.exec(path)![1]) + 1, sql }))
    .sort((a, b) => a.version - b.version);
}

const clock = () => new Date('2026-11-05T10:00:00.000Z');

async function scalar(driver: SqlDriver, sql: string) {
  return (await driver.query(sql, [], 'get')).rows[0]?.[0];
}

const EXTRA_OK = {
  version: 7,
  sql: 'ALTER TABLE `areas` ADD `icon` text;--> statement-breakpoint\nCREATE TABLE `extra` (`id` text);',
};
const EXTRA_FAILING = {
  version: 7,
  sql: 'CREATE TABLE `half` (`id` text);--> statement-breakpoint\nINSERT INTO `no_such_table` VALUES (1);',
};

describe('migrations', () => {
  it('creates 13 entity tables and settings on a fresh install at version 6', async () => {
    const { driver, schemaVersion } = await openTestDatabase();
    expect(schemaVersion).toBe(6);
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(6);
    const tables = await driver.query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name", [], 'all');
    const names = tables.rows.map((r) => r[0]);
    expect(names).toHaveLength(14);
    expect(names).toContain('settings');
  });

  it('exposes the latest migration number as SCHEMA_VERSION', async () => {
    const { schemaVersion } = await openTestDatabase();
    expect(SCHEMA_VERSION).toBe(schemaVersion);
  });

  it('runs nothing when already at the current version', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await driver.query('CREATE TABLE marker (x)', [], 'run');
    const result = await migrate(driver);
    expect(result).toEqual({ fromVersion: 6, schemaVersion: 6 });
  });

  it('upgrades with a newer migration and keeps existing rows', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await driver.query("INSERT INTO areas (id, created_at, updated_at, name, color) VALUES ('a', 't', 't', 'Job', '#000000')", [], 'run');
    const result = await migrate(driver, [
      { version: 1, sql: 'SELECT 1' },
      { version: 2, sql: 'SELECT 1' },
      { version: 3, sql: 'SELECT 1' },
      { version: 4, sql: 'SELECT 1' },
      { version: 5, sql: 'SELECT 1' },
      { version: 6, sql: 'SELECT 1' },
      EXTRA_OK,
    ]);
    expect(result).toEqual({ fromVersion: 6, schemaVersion: 7 });
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(7);
    expect(await scalar(driver, "SELECT name FROM areas WHERE id = 'a'")).toBe('Job');
    expect(await scalar(driver, 'SELECT count(*) FROM extra')).toBe(0);
  });

  it('leaves no partial changes and the old version when a migration fails', async () => {
    const driver = createNodeDriver();
    await migrate(driver);
    await expect(
      migrate(driver, [
        { version: 1, sql: 'SELECT 1' },
        { version: 2, sql: 'SELECT 1' },
        { version: 3, sql: 'SELECT 1' },
        { version: 4, sql: 'SELECT 1' },
        { version: 5, sql: 'SELECT 1' },
        { version: 6, sql: 'SELECT 1' },
        EXTRA_FAILING,
      ]),
    ).rejects.toThrow();
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(6);
    expect(await scalar(driver, "SELECT count(*) FROM sqlite_master WHERE name = 'half'")).toBe(0);
  });

  it('rolls back user_version itself with the batch', async () => {
    const driver = createNodeDriver();
    await expect(
      driver.batch([
        { sql: 'PRAGMA user_version = 6', params: [], method: 'run' },
        { sql: 'INSERT INTO nope VALUES (1)', params: [], method: 'run' },
      ]),
    ).rejects.toThrow();
    expect(await scalar(driver, 'PRAGMA user_version')).toBe(0);
  });
});

describe('project colour migration', () => {
  it('adds an empty colour to projects of a version-1 database and keeps the rows', async () => {
    const driver = createNodeDriver();
    const all = bundledMigrationsForTest();
    await migrate(driver, all.slice(0, 1));
    await driver.query("INSERT INTO projects (id, created_at, updated_at, title) VALUES ('p', 't', 't', 'Garden')", [], 'run');
    const result = await migrate(driver);
    expect(result).toEqual({ fromVersion: 1, schemaVersion: 6 });
    expect(await scalar(driver, "SELECT title FROM projects WHERE id = 'p'")).toBe('Garden');
    expect(await scalar(driver, "SELECT color FROM projects WHERE id = 'p'")).toBeNull();
  });
});

describe('habit link migration', () => {
  it('adds an empty habit link to the timer and log entries of a version-2 database and keeps the rows', async () => {
    const driver = createNodeDriver();
    await migrate(driver, bundledMigrationsForTest().slice(0, 2));
    await driver.query("INSERT INTO log_entries (id, created_at, updated_at, occurred_at) VALUES ('l', 't', 't', 't')", [], 'run');
    const result = await migrate(driver);
    expect(result).toEqual({ fromVersion: 2, schemaVersion: 6 });
    expect(await scalar(driver, "SELECT occurred_at FROM log_entries WHERE id = 'l'")).toBe('t');
    expect(await scalar(driver, "SELECT habit_id FROM log_entries WHERE id = 'l'")).toBeNull();
    expect(await scalar(driver, 'SELECT count(*) FROM timers WHERE habit_id IS NULL')).toBe(0);
  });
});

describe('timer session migration', () => {
  it('adds the paused state and worked minutes to a version-3 timer and keeps it running', async () => {
    const driver = createNodeDriver();
    await migrate(driver, bundledMigrationsForTest().slice(0, 3));
    await driver.query(
      "INSERT INTO timers (id, created_at, updated_at, started_at, planned_minutes) VALUES ('t', 'x', 'x', '2026-11-07T09:00:00.000Z', 30)",
      [],
      'run',
    );
    const result = await migrate(driver);
    expect(result).toEqual({ fromVersion: 3, schemaVersion: 6 });
    expect(await scalar(driver, "SELECT planned_minutes FROM timers WHERE id = 't'")).toBe(30);
    expect(await scalar(driver, "SELECT paused_at FROM timers WHERE id = 't'")).toBeNull();
    expect(await scalar(driver, "SELECT worked_seconds FROM timers WHERE id = 't'")).toBe(0);
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
