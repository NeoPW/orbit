import { isNull } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields } from '../../../core/db/records.ts';
import { areas } from '../../../core/db/schema.ts';

// Placeholder until the area screens exist: lists the areas and adds a test
// area, so sync can be checked by hand between devices. app-shell removes it.

export function TestAreas({ db, refreshKey }: { db: Db; refreshKey: number }) {
  const [names, setNames] = useState<string[]>([]);
  const [added, setAdded] = useState(0);

  useEffect(() => {
    let active = true;
    void db
      .select()
      .from(areas)
      .where(isNull(areas.deletedAt))
      .orderBy(areas.sortOrder)
      .then((rows) => {
        if (active) setNames(rows.map((r) => r.name));
      });
    return () => {
      active = false;
    };
  }, [db, refreshKey, added]);

  async function add() {
    const now = new Date();
    await db.insert(areas).values({
      ...createFields(() => now),
      name: `Test ${now.toLocaleTimeString('en-GB')}`,
      color: '#1E88E5',
      sortOrder: names.length,
    });
    setAdded((n) => n + 1);
  }

  return (
    <section>
      <h2>Areas</h2>
      <ul>
        {names.map((name, i) => (
          <li key={`${i}-${name}`}>{name}</li>
        ))}
      </ul>
      <button onClick={() => void add()}>Add test area</button>
    </section>
  );
}
