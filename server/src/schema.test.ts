import { describe, expect, it } from 'vitest';
import { TABLE_NAMES, TABLES } from './tables.ts';
import { openServerTestDatabase } from './testing.ts';

describe('server schema', () => {
  it('has exactly the app columns plus server_seq in every synced table', async () => {
    const driver = await openServerTestDatabase();
    for (const name of TABLE_NAMES) {
      const info = await driver.query(`PRAGMA table_info(${name})`, [], 'all');
      const serverColumns = info.rows.map((r) => r[1]).sort();
      expect(serverColumns, name).toEqual([...TABLES[name].columns, 'server_seq'].sort());
    }
  });

  it('has no settings table', async () => {
    const driver = await openServerTestDatabase();
    const { rows } = await driver.query("SELECT name FROM sqlite_master WHERE type = 'table'", [], 'all');
    const names = rows.map((r) => r[0]);
    expect(names).not.toContain('settings');
    expect(names).toHaveLength(TABLE_NAMES.length + 1); // + sync_state
  });
});
