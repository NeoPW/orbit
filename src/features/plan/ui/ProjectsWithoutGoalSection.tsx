import { FolderKanban, Plus } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { ProjectRow } from '../../projects/ui/ProjectRow.tsx';
import { withoutActiveGoal } from '../domain/plan.ts';
import type { PlanSectionProps } from './sections.ts';

/** Active projects without a goal, and active projects whose goal is not active (with the goal's title). */
export function ProjectsWithoutGoalSection({ onCreate }: PlanSectionProps) {
  const data = useLiveQuery(async (db) => ({
    areas: await listAreas(db),
    views: withoutActiveGoal(await listProjectsByStatus(db, 'active')),
  }));
  const views = data ? sortViewsForPlan(data.views) : [];

  return (
    <Section
      title="Projects without a goal"
      count={data ? views.length : undefined}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => onCreate('project')}>
          New project
        </Button>
      }
    >
      {data && views.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          text="No active projects without a goal"
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => onCreate('project')}>
              New project
            </Button>
          }
        />
      )}
      <div>
        {views.map((view) => (
          <ProjectRow key={view.project.id} view={view} showGoal area={data?.areas.find((a) => a.id === view.project.areaId)} />
        ))}
      </div>
    </Section>
  );
}
