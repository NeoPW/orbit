import { Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { AreaSheet } from '../../areas/ui/AreaSheet.tsx';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { Area } from '../../../core/db/schema.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import styles from './PlanScreen.module.css';

export function AreasSection() {
  const areas = useLiveQuery(listAreas);
  const [sheet, setSheet] = useState<{ area?: Area } | null>(null);

  return (
    <Section
      title="Areas"
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setSheet({})}>
          New area
        </Button>
      }
    >
      <div className={styles.areaGrid}>
        {areas?.map((area) => (
          <button key={area.id} type="button" className={styles.areaTile} style={{ '--pc': area.color } as CSSProperties} onClick={() => setSheet({ area })}>
            <span className={styles.areaDot} aria-hidden="true" />
            <span className={styles.areaName}>{area.name}</span>
          </button>
        ))}
      </div>
      {sheet && <AreaSheet area={sheet.area} count={areas?.length} onClose={() => setSheet(null)} />}
    </Section>
  );
}
