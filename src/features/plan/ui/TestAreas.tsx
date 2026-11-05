import { isNull } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { createFields } from '../../../core/db/records.ts';
import { areas } from '../../../core/db/schema.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { useSync } from '../../sync/ui/SyncRunner.tsx';
import styles from './PlanScreen.module.css';

// Placeholder until the area screens exist: lists the areas and adds a test
// area, so sync can be checked by hand between devices. The areas change removes it.

interface AreaChip {
  id: string;
  name: string;
  color: string;
}

export function TestAreas() {
  const { db } = useServices();
  const { dataVersion } = useSync();
  const [rows, setRows] = useState<AreaChip[]>([]);
  const [added, setAdded] = useState(0);

  useEffect(() => {
    let active = true;
    void db
      .select()
      .from(areas)
      .where(isNull(areas.deletedAt))
      .orderBy(areas.sortOrder)
      .then((result) => {
        if (active) setRows(result.map((r) => ({ id: r.id, name: r.name, color: r.color })));
      });
    return () => {
      active = false;
    };
  }, [db, dataVersion, added]);

  async function add() {
    const now = new Date();
    await db.insert(areas).values({
      ...createFields(() => now),
      name: `Test ${now.toLocaleTimeString('en-GB')}`,
      color: '#1E88E5',
      sortOrder: rows.length,
    });
    setAdded((n) => n + 1);
  }

  return (
    <section className={styles.section}>
      <h2>Areas</h2>
      <div className={styles.chips}>
        {rows.map((area) => (
          <Chip key={area.id} color={area.color}>
            {area.name}
          </Chip>
        ))}
        <Button variant="ghost" icon={<Plus />} onClick={() => void add()}>
          Add test area
        </Button>
      </div>
    </section>
  );
}
