import type { SqlDriver } from '../../platform/db/driver.ts';

export interface Migration {
  /** Schema version after this migration is applied (file number + 1). */
  version: number;
  sql: string;
}

const BREAKPOINT = '--> statement-breakpoint';

function bundledMigrations(): Migration[] {
  const files = import.meta.glob('../../../drizzle/*.sql', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  return Object.entries(files).map(([path, sql]) => {
    const number = /(\d+)_[^/]*\.sql$/.exec(path)?.[1];
    if (number === undefined) throw new Error(`Unexpected migration file name: ${path}`);
    return { version: Number(number) + 1, sql };
  });
}

export interface MigrateResult {
  /** The version the database had before (0 for a new database). */
  fromVersion: number;
  schemaVersion: number;
}

/**
 * Applies pending migrations in order, each as one batch together with
 * `PRAGMA user_version`, so a failing migration leaves nothing behind.
 */
export async function migrate(
  driver: SqlDriver,
  migrations: Migration[] = bundledMigrations(),
): Promise<MigrateResult> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  const { rows } = await driver.query('PRAGMA user_version', [], 'get');
  const fromVersion = Number(rows[0]?.[0] ?? 0);
  const latest = sorted.at(-1)?.version ?? 0;
  if (fromVersion > latest) {
    throw new Error(`The database (version ${fromVersion}) is newer than this app (version ${latest}).`);
  }
  for (const migration of sorted.filter((m) => m.version > fromVersion)) {
    const statements = migration.sql
      .split(BREAKPOINT)
      .map((s) => s.trim())
      .filter((s) => s !== '');
    await driver.batch([
      ...statements.map((sql) => ({ sql, params: [], method: 'run' as const })),
      { sql: `PRAGMA user_version = ${migration.version}`, params: [], method: 'run' as const },
    ]);
  }
  return { fromVersion, schemaVersion: Math.max(fromVersion, latest) };
}
