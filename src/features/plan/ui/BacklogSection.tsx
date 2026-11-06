import { Inbox, Play, Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { navigate } from '../../../core/routing/useRoute.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listProjectsByStatus, setProjectStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { PROJECT_STATUS_LABELS } from '../../projects/ui/ProjectRow.tsx';
import { filterByArea, type AreaFilter } from '../domain/plan.ts';
import styles from './PlanScreen.module.css';
import type { PlanSectionProps } from './sections.ts';

const ALL = 'all';
const NONE = 'none';
const clock = () => new Date();

/** Backlog and paused projects, filterable by area (including no area), each with Activate. */
export function BacklogSection({ onCreate }: PlanSectionProps) {
  const { db } = useServices();
  const data = useLiveQuery(async (database) => ({
    areas: await listAreas(database),
    views: await listProjectsByStatus(database, 'backlog', 'paused'),
  }));
  const [choice, setChoice] = useState(ALL);

  const filter: AreaFilter = choice === ALL ? undefined : choice === NONE ? null : choice;
  const views = data ? sortViewsForPlan(filterByArea(data.views, filter)) : [];

  return (
    <Section
      title="Backlog"
      count={data ? views.length : undefined}
      actions={
        <>
          {data && data.views.length > 0 && (
            <div role="group" aria-label="Filter by area" className={styles.filters}>
              {[{ value: ALL, label: 'All areas' }, { value: NONE, label: 'No area' }, ...data.areas.map((a) => ({ value: a.id, label: a.name }))].map((o) => (
                <button key={o.value} type="button" aria-pressed={choice === o.value} className={styles.filterChip} onClick={() => setChoice(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" icon={<Plus />} onClick={() => onCreate('project')}>
            New project
          </Button>
        </>
      }
    >
      {data && views.length === 0 && (
        <EmptyState
          icon={Inbox}
          text="The backlog is empty"
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => onCreate('project')}>
              New project
            </Button>
          }
        />
      )}
      {views.length > 0 && (
        <Tile>
          <div className={styles.rows}>
            {views.map((view) => {
              const area = data?.areas.find((a) => a.id === view.project.areaId);
              return (
                <ListRow
                  key={view.project.id}
                  leading={<span className={styles.dot} style={{ '--pc': view.color } as CSSProperties} aria-hidden="true" />}
                  title={view.project.title}
                  onOpen={() => navigate({ name: 'project', id: view.project.id })}
                  meta={
                    <>
                      {view.project.status !== 'active' && <Chip tone="amber">{PROJECT_STATUS_LABELS[view.project.status]}</Chip>}
                      {area && <Chip color={area.color}>{area.name}</Chip>}
                      <ImportanceDots value={view.project.importance} />
                      {view.deadline && <DeadlineBadge deadline={view.deadline.date} inherited={view.deadline.inherited} />}
                    </>
                  }
                  trailing={
                    <Button variant="ghost" icon={<Play />} onClick={() => void setProjectStatus(db, clock, view.project.id, 'active')}>
                      Activate
                    </Button>
                  }
                />
              );
            })}
          </div>
        </Tile>
      )}
    </Section>
  );
}
