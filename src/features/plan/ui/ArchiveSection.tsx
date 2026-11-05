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
import { ProjectRow } from '../../projects/ui/ProjectRow.tsx';
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
      <div>
        {data?.items.map((entry) =>
          entry.kind === 'goal' ? (
            <ListRow
              key={entry.item.id}
              title={entry.item.title}
              onOpen={() => navigate({ name: 'goal', id: entry.item.id })}
              meta={<Chip tone={entry.item.status === 'completed' ? 'secondary' : 'neutral'}>{entry.item.status === 'completed' ? 'Completed goal' : 'Archived goal'}</Chip>}
            />
          ) : (
            <ProjectRow key={entry.item.project.id} view={entry.item} area={data.areas.find((a) => a.id === entry.item.project.areaId)} />
          ),
        )}
      </div>
    </Section>
  );
}
