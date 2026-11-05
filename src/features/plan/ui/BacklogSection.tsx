import { Inbox, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listProjectsByStatus, setProjectStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { ProjectRow } from '../../projects/ui/ProjectRow.tsx';
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
        <Button variant="ghost" icon={<Plus />} onClick={() => onCreate('project')}>
          New project
        </Button>
      }
    >
      {data && data.views.length > 0 && (
        <div className={styles.filter}>
          <Select
            label="Area"
            value={choice}
            onChange={setChoice}
            options={[
              { value: ALL, label: 'All areas' },
              { value: NONE, label: 'No area' },
              ...data.areas.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        </div>
      )}
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
      <div>
        {views.map((view) => (
          <ProjectRow
            key={view.project.id}
            view={view}
            showStatus
            area={data?.areas.find((a) => a.id === view.project.areaId)}
            trailing={
              <Button variant="ghost" icon={<Play />} onClick={() => void setProjectStatus(db, clock, view.project.id, 'active')}>
                Activate
              </Button>
            }
          />
        ))}
      </div>
    </Section>
  );
}
