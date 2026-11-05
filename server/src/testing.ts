import { migrate, type Migration } from '../../src/core/db/migrate.ts';
import { createNodeDriver } from '../../src/platform/db/node.ts';

function serverMigrations(): Migration[] {
  const files = import.meta.glob('../migrations/*.sql', {
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

/** An in-memory server database with the D1 migrations applied. */
export async function openServerTestDatabase() {
  const driver = createNodeDriver();
  await migrate(driver, serverMigrations());
  return driver;
}
