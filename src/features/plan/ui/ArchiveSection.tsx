import { Archive } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listArchivedGoals } from '../../goals/data/goals-repository.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { goalColor } from '../../../core/ui/colors.ts';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import styles from './PlanScreen.module.css';
import { archiveItems } from '../domain/plan.ts';

/** Completed and archived goals and completed projects, most recently updated first. */
export function ArchiveSection() {
  const data = useLiveQuery(async (db) => ({
    areas: await listAreas(db),
    items: archiveItems(await listArchivedGoals(db), await listProjectsByStatus(db, 'completed')),
  }));

  return (
    <Section title="Archive" count={data?.items.length}>
      {data && data.items.length === 0 && <EmptyState icon={Archive} text="Nothing archived yet" />}
      <div className={styles.archiveGrid}>
        {data?.items.map((entry) => {
          const area = entry.kind === 'project' ? data.areas.find((a) => a.id === entry.item.project.areaId) : undefined;
          return entry.kind === 'goal' ? (
            <Tile key={entry.item.id} color={entry.item.color ? goalColor(entry.item, 0) : undefined}>
              <ListRow
                title={entry.item.title}
                onOpen={() => navigate({ name: 'goal', id: entry.item.id })}
                meta={
                  <Chip tone={entry.item.status === 'completed' ? 'secondary' : 'neutral'}>
                    {entry.item.status === 'completed' ? 'Completed goal' : 'Archived goal'}
                  </Chip>
                }
              />
            </Tile>
          ) : (
            <Tile key={entry.item.project.id} color={entry.item.color}>
              <ListRow
                title={entry.item.project.title}
                onOpen={() => navigate({ name: 'project', id: entry.item.project.id })}
                meta={
                  <>
                    <Chip tone="secondary">Completed project</Chip>
                    {area && <Chip color={area.color}>{area.name}</Chip>}
                  </>
                }
              />
            </Tile>
          );
        })}
      </div>
    </Section>
  );
}
