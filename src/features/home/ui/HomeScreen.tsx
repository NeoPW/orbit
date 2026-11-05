import { Check, FolderKanban, ListTodo, NotebookPen, Plus, Repeat } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useServices } from '../../../app/services.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { AnimatedList } from '../../../core/ui/components/AnimatedList.tsx';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { checkHabit, uncheckHabit } from '../../habits/data/habits-repository.ts';
import type { Task } from '../../tasks/data/tasks-repository.ts';
import { LogWorkSheet } from '../../work-log/ui/LogWorkSheet.tsx';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { TaskSheet } from '../../tasks/ui/TaskSheet.tsx';
import { useCompleteTask } from '../../tasks/ui/useCompleteTask.ts';
import { FocusPanel } from '../../timer/ui/FocusPanel.tsx';
import { useStartFocus } from '../../timer/ui/useStartFocus.ts';
import { listActiveProjects, listHabitsForToday, listTodo, type HabitItem } from '../data/home-queries.ts';
import styles from './HomeScreen.module.css';

const clock = () => new Date();

function weekday(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });
}

export function HomeScreen() {
  const { db } = useServices();
  const today = useToday();
  const complete = useCompleteTask();
  const { startWithLastLength } = useStartFocus();
  const data = useLiveQuery(
    async (database) => {
      const [todo, projects, habits] = await Promise.all([
        listTodo(database, today),
        listActiveProjects(database, today),
        listHabitsForToday(database, today),
      ]);
      return { todo, projects, habits };
    },
    [today],
  );
  const [creating, setCreating] = useState(false);
  const [logging, setLogging] = useState(false);

  if (!data) return null;
  const { todo, projects, habits } = data;
  const itemByTask = new Map(todo.map((item) => [item.task.id, item]));

  function toggleHabit(habit: HabitItem) {
    void (habit.checked ? uncheckHabit(db, clock, habit.id, today) : checkHabit(db, clock, habit.id, today));
  }

  return (
    <>
      <PageHeader
        title={`${weekday(today)} ${formatDate(today)}`}
        actions={
          <>
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              New task
            </Button>
            <Button icon={<NotebookPen />} onClick={() => setLogging(true)}>
              Log work
            </Button>
          </>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <FocusPanel todo={todo} projects={projects} />

          <Section title="Habits due today">
            {habits.length === 0 ? (
              <EmptyState
                icon={Repeat}
                text="No habits due today"
                action={<Button onClick={() => navigate({ name: 'plan' })}>Open Plan</Button>}
              />
            ) : (
              <div className={styles.habits}>
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    className={`${styles.habit} ${habit.checked ? styles.checked : ''}`}
                    aria-pressed={habit.checked}
                    onClick={() => toggleHabit(habit)}
                  >
                    {habit.checked && <Check aria-hidden="true" />}
                    <span className={styles.habitTitle}>{habit.title}</span>
                    {habit.label && <span className={styles.habitLabel}>{habit.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="To do" count={todo.length}>
            {todo.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                text="Nothing to do"
                action={
                  <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                    New task
                  </Button>
                }
              />
            ) : (
              <TaskList
                tasks={todo.map((item) => item.task)}
                label="To do"
                rowProps={(task) => ({
                  importance: itemByTask.get(task.id)?.importance,
                  context: itemByTask.get(task.id)?.context ?? undefined,
                  onStartFocus: () => void startWithLastLength({ taskId: task.id }),
                })}
              />
            )}
          </Section>
        </div>

        <aside className={styles.side}>
          <Section title="Active projects" count={projects.length}>
            {projects.length === 0 ? (
              <EmptyState icon={FolderKanban} text="No active projects" action={<Button onClick={() => navigate({ name: 'plan' })}>Open Plan</Button>} />
            ) : (
              <div className={styles.projects}>
                {projects.map(({ view, area, nextSteps }) => (
                  <article key={view.project.id} className={styles.project}>
                    <div className={styles.projectHead}>
                      <button type="button" className={styles.projectTitle} onClick={() => navigate({ name: 'project', id: view.project.id })}>
                        <span className={styles.dot} style={area ? ({ '--area-color': area.color } as CSSProperties) : undefined} aria-hidden="true" />
                        {view.project.title}
                      </button>
                      {view.deadline && <DeadlineBadge deadline={view.deadline.date} inherited={view.deadline.inherited} />}
                    </div>
                    {nextSteps.length > 0 && (
                      <AnimatedList
                        items={nextSteps}
                        getKey={(task: Task) => task.id}
                        label={`Next steps of ${view.project.title}`}
                        renderItem={(task: Task) => (
                          <div className={styles.step}>
                            <Checkbox checked={false} label={<span className="visually-hidden">Complete {task.title}</span>} onChange={() => void complete(task)} />
                            <button type="button" className={styles.stepOpen} onClick={() => navigate({ name: 'task', id: task.id })}>
                              {task.title}
                            </button>
                          </div>
                        )}
                      />
                    )}
                  </article>
                ))}
              </div>
            )}
          </Section>
        </aside>
      </div>
      {creating && <TaskSheet onClose={() => setCreating(false)} />}
      {logging && <LogWorkSheet onClose={() => setLogging(false)} />}
    </>
  );
}
