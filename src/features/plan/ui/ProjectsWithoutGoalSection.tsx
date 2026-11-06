import { FolderKanban, Plus } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { withoutActiveGoal } from '../domain/plan.ts';
import styles from './PlanScreen.module.css';
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
      <div className={styles.projectGrid}>
        {views.map((view) => {
          const area = data?.areas.find((a) => a.id === view.project.areaId);
          return (
            <Tile
              key={view.project.id}
              as="article"
              color={view.color}
              tinted
              title={
                <button type="button" className={styles.tileTitle} onClick={() => navigate({ name: 'project', id: view.project.id })}>
                  {view.project.title}
                </button>
              }
            >
              <div className={styles.tileMeta}>
                {area && <Chip color={area.color}>{area.name}</Chip>}
                {view.deadline && <DeadlineBadge deadline={view.deadline.date} inherited={view.deadline.inherited} />}
                <ImportanceDots value={view.project.importance} />
                {view.goalTitle && <span className={styles.goalName}>{view.goalTitle}</span>}
              </div>
            </Tile>
          );
        })}
      </div>
    </Section>
  );
}
