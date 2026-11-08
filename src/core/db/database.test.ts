import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodeDriver } from '../../platform/db/node.ts';
import type { SqlDriver } from '../../platform/db/driver.ts';
import { openDatabase } from './database.ts';
import { deleteFields, notDeleted } from './records.ts';
import { areas } from './schema.ts';

let dir: string;
let drivers: SqlDriver[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'orbit-db-'));
  drivers = [];
});

afterEach(async () => {
  await Promise.all(drivers.map((d) => d.close()));
  rmSync(dir, { recursive: true, force: true });
});

function driverFor(file: string) {
  const driver = createNodeDriver(join(dir, file));
  drivers.push(driver);
  return driver;
}

describe('openDatabase', () => {
  it('seeds Job, Personal, Sport, Uni in order on the first open', async () => {
    const result = await openDatabase(driverFor('a.db'), 'file');
    if (result.status !== 'ready') throw new Error('not ready');
    expect(result.schemaVersion).toBe(6);
    expect(result.storage).toBe('file');
    const rows = await result.db.select().from(areas).orderBy(asc(areas.sortOrder));
    expect(rows.map((r) => [r.name, r.color])).toEqual([
      ['Job', '#1E88E5'],
      ['Personal', '#8E24AA'],
      ['Sport', '#43A047'],
      ['Uni', '#FB8C00'],
    ]);
  });

  it('seeds on a later open when the first seed did not happen', async () => {
    const first = await openDatabase(driverFor('c.db'), 'file', { seed: false });
    if (first.status !== 'ready') throw new Error('not ready');
    expect(await first.db.select().from(areas)).toHaveLength(0);
    await drivers[0]?.close();
    drivers.length = 0;

    const second = await openDatabase(driverFor('c.db'), 'file');
    if (second.status !== 'ready') throw new Error('not ready');
    expect(await second.db.select().from(areas)).toHaveLength(4);
  });

  it('does not re-seed after Uni was soft-deleted', async () => {
    const first = await openDatabase(driverFor('b.db'), 'file');
    if (first.status !== 'ready') throw new Error('not ready');
    await first.db
      .update(areas)
      .set(deleteFields(() => new Date()))
      .where(eq(areas.name, 'Uni'));
    await drivers[0]?.close();
    drivers.length = 0;

    const second = await openDatabase(driverFor('b.db'), 'file');
    if (second.status !== 'ready') throw new Error('not ready');
    const live = await second.db.select().from(areas).where(notDeleted(areas));
    expect(live.map((r) => r.name)).toEqual(['Job', 'Personal', 'Sport']);
    expect(await second.db.select().from(areas)).toHaveLength(4);
  });

  it('gives status error when a migration fails', async () => {
    const result = await openDatabase(driverFor('c.db'), 'file', {
      migrations: [{ version: 1, sql: 'INSERT INTO missing VALUES (1)' }],
    });
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.message).toContain('missing');
  });
});
