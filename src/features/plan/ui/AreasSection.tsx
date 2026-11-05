import { Plus } from 'lucide-react';
import { useState } from 'react';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { AreaSheet } from '../../areas/ui/AreaSheet.tsx';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { Area } from '../../../core/db/schema.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
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
      <div className={styles.chips}>
        {areas?.map((area) => (
          <Chip key={area.id} color={area.color} onClick={() => setSheet({ area })}>
            {area.name}
          </Chip>
        ))}
      </div>
      {sheet && <AreaSheet area={sheet.area} count={areas?.length} onClose={() => setSheet(null)} />}
    </Section>
  );
}
