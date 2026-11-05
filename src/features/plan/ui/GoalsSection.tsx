import type { CSSProperties } from 'react';
import { Plus, Target } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { formatDateRange } from '../../../core/dates/format.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { goalColor } from '../../../core/ui/palette.ts';
import { listActiveGoals } from '../../goals/data/goals-repository.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { ProjectRow } from '../../projects/ui/ProjectRow.tsx';
import { listOpenTasksOfGoal } from '../../tasks/data/tasks-repository.ts';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { goalProgress, measureProgress } from '../../goals/domain/goals.ts';
import styles from './PlanScreen.module.css';
import type { PlanSectionProps } from './sections.ts';

export function GoalsSection({ onCreate }: PlanSectionProps) {
  const data = useLiveQuery(async (db) => {
    const goals = await listActiveGoals(db);
    const [areas, projects, goalTasks] = await Promise.all([
      listAreas(db),
      listProjectsByStatus(db, 'active'),
      Promise.all(goals.map((g) => listOpenTasksOfGoal(db, g.goal.id))),
    ]);
    return { goals, areas, projects, goalTasks };
  });
  const goals = data?.goals;

  return (
    <Section title="Goals">
      {goals && goals.length === 0 && (
        <EmptyState
          icon={Target}
          text="No active goals"
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => onCreate('goal')}>
              New goal
            </Button>
          }
        />
      )}
      <div className={styles.goalList}>
        {goals?.map(({ goal, index, measures }, goalIndex) => {
          const projects = sortViewsForPlan(data!.projects.filter((v) => v.project.goalId === goal.id));
          const tasks = data!.goalTasks[goalIndex] ?? [];
          const color = goalColor(goal, index);
          const progresses = measures.map((m) => measureProgress(m, m.checkIns));
          const progress = goalProgress(progresses);
          const open = () => navigate({ name: 'goal', id: goal.id });
          return (
            <article key={goal.id} className={styles.goal} style={{ '--goal-color': color } as CSSProperties}>
              <button type="button" className={styles.goalHead} onClick={open}>
                <span className={styles.goalTitle}>{goal.title}</span>
                {progress !== null && <ProgressBar value={progress} color={color} label={`Progress of ${goal.title}`} />}
                <span className={styles.goalMeta}>
                  {goal.startDate && goal.endDate && <span>{formatDateRange(goal.startDate, goal.endDate)}</span>}
                  {goal.endDate && <DeadlineBadge deadline={goal.endDate} />}
                </span>
              </button>
              {measures.map((measure, i) => (
                <button key={measure.id} type="button" className={styles.measure} onClick={open}>
                  <span>{measure.title}</span>
                  <ProgressBar value={progresses[i] ?? 0} color={color} label={measure.title} />
                </button>
              ))}
              {projects.length > 0 && (
                <div className={styles.goalItems}>
                  {projects.map((view) => (
                    <ProjectRow key={view.project.id} view={view} area={data!.areas.find((a) => a.id === view.project.areaId)} />
                  ))}
                </div>
              )}
              {tasks.length > 0 && (
                <div className={styles.goalItems}>
                  <TaskList tasks={tasks} label={`Tasks of ${goal.title}`} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
