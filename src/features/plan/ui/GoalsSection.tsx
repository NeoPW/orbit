import type { CSSProperties } from 'react';
import { Plus, Target } from 'lucide-react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { formatDateRange } from '../../../core/dates/format.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import { listActiveGoals } from '../../goals/data/goals-repository.ts';
import { listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { listOpenTasksOfGoal } from '../../tasks/data/tasks-repository.ts';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { goalProgress, measureProgress, measureValueText } from '../../goals/domain/goals.ts';
import styles from './PlanScreen.module.css';
import type { PlanSectionProps } from './sections.ts';

export function GoalsSection({ onCreate }: PlanSectionProps) {
  const data = useLiveQuery(async (db) => {
    const goals = await listActiveGoals(db);
    const [projects, goalTasks] = await Promise.all([listProjectsByStatus(db, 'active'), Promise.all(goals.map((g) => listOpenTasksOfGoal(db, g.goal.id)))]);
    return { goals, projects, goalTasks };
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
          const percent = progress === null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
          const open = () => navigate({ name: 'goal', id: goal.id });
          return (
            <Tile
              key={goal.id}
              as="article"
              color={color}
              tinted
              aria-label={goal.title}
              title={
                <div className={styles.goalHeadRow}>
                  <button type="button" className={styles.goalHead} onClick={open}>
                    <span className={styles.goalTitle}>{goal.title}</span>
                    <span className={styles.goalMeta}>
                      {goal.startDate && goal.endDate && <span>{formatDateRange(goal.startDate, goal.endDate)}</span>}
                      {goal.endDate && <DeadlineBadge deadline={goal.endDate} />}
                    </span>
                  </button>
                  {percent !== null && (
                    <div className={styles.goalProgress}>
                      <div className={styles.goalProgressTop}>
                        <span>Progress</span>
                        <span className={styles.goalPercent}>{percent} %</span>
                      </div>
                      <div
                        className={styles.goalTrack}
                        role="progressbar"
                        aria-label={`Progress of ${goal.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      >
                        <div className={styles.goalFill} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <div className={styles.goalColumns}>
                <div className={styles.goalColumn}>
                  <h4 className={styles.subheading}>Measures</h4>
                  {measures.length === 0 && <p className={styles.none}>No measures</p>}
                  <div className={styles.measures}>
                    {measures.map((measure, i) => {
                      const pct = Math.round(Math.min(1, Math.max(0, progresses[i] ?? 0)) * 100);
                      return (
                        <button key={measure.id} type="button" className={styles.measure} onClick={open}>
                          <span className={styles.measureTop}>
                            <span className={styles.measureTitle}>{measure.title}</span>
                            <span className={styles.measureValue}>
                              {measureValueText(measure, measure.checkIns)} · {pct} %
                            </span>
                          </span>
                          <span
                            className={styles.measureTrack}
                            role="progressbar"
                            aria-label={measure.title}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={pct}
                          >
                            <span className={styles.measureFill} style={{ width: `${pct}%` }} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.goalColumn}>
                  <h4 className={styles.subheading}>Projects</h4>
                  {projects.length === 0 && <p className={styles.none}>No projects</p>}
                  <div className={styles.miniProjects}>
                    {projects.map((view) => (
                      <button
                        key={view.project.id}
                        type="button"
                        className={styles.miniProject}
                        style={{ '--pc': view.color } as CSSProperties}
                        onClick={() => navigate({ name: 'project', id: view.project.id })}
                      >
                        <span className={styles.miniTitle}>{view.project.title}</span>
                        {view.deadline && <DeadlineBadge deadline={view.deadline.date} inherited={view.deadline.inherited} />}
                      </button>
                    ))}
                  </div>
                  {tasks.length > 0 && (
                    <>
                      <h4 className={`${styles.subheading} ${styles.tasksHeading}`}>Open tasks</h4>
                      <TaskList tasks={tasks} label={`Tasks of ${goal.title}`} />
                    </>
                  )}
                </div>
              </div>
            </Tile>
          );
        })}
      </div>
    </Section>
  );
}
