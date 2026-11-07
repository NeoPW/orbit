import { Check, FolderKanban, ListTodo, NotebookPen, Play, Plus, Repeat } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useServices } from '../../../app/services.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useToday } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { AnimatedList } from '../../../core/ui/components/AnimatedList.tsx';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { useIsPhone } from '../../../core/ui/useIsPhone.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { checkHabit, uncheckHabit } from '../../habits/data/habits-repository.ts';
import { reopenTask, type Task } from '../../tasks/data/tasks-repository.ts';
import { LogWorkSheet } from '../../work-log/ui/LogWorkSheet.tsx';
import { TodayTile } from '../../timeline/ui/TodayTile.tsx';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { TaskSheet } from '../../tasks/ui/TaskSheet.tsx';
import { useCompleteTask } from '../../tasks/ui/useCompleteTask.ts';
import { FocusPanel } from '../../timer/ui/FocusPanel.tsx';
import { useStartFocus } from '../../timer/ui/useStartFocus.ts';
import { listActiveProjects, listDoneToday, listHabitsForToday, listTodo, type HabitItem } from '../data/home-queries.ts';
import styles from './HomeScreen.module.css';

const clock = () => new Date();

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function weekday(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
  });
}

export function HomeScreen() {
  const { db } = useServices();
  const today = useToday();
  const isPhone = useIsPhone();
  const complete = useCompleteTask();
  const { start } = useStartFocus();
  const data = useLiveQuery(
    async (database) => {
      const [todo, projects, habits, done] = await Promise.all([
        listTodo(database, today),
        listActiveProjects(database, today),
        listHabitsForToday(database, today),
        listDoneToday(database, today),
      ]);
      return { todo, projects, habits, done };
    },
    [today],
  );
  const [creating, setCreating] = useState(false);
  const [logging, setLogging] = useState(false);

  if (!data) return null;
  const { todo, projects, habits, done } = data;
  const itemByTask = new Map(todo.map((item) => [item.task.id, item]));

  function toggleHabit(habit: HabitItem) {
    void (habit.checked ? uncheckHabit(db, clock, habit.id, today) : checkHabit(db, clock, habit.id, today));
  }

  return (
    <>
      <PageHeader
        title={`${weekday(today)} ${formatDate(today)}`}
        actions={
          isPhone ? (
            <IconButton label="New task" tooltip="none" icon={<Plus />} className={styles.quickAdd} onClick={() => setCreating(true)} />
          ) : (
            <>
              <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                New task
              </Button>
              <Button icon={<NotebookPen />} onClick={() => setLogging(true)}>
                Log work
              </Button>
            </>
          )
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <FocusPanel projects={projects} />

          <Tile
            title={<h2 className={styles.tileTitle}>Habits due today</h2>}
            actions={
              habits.length > 0 ? (
                <span className={styles.count}>
                  {habits.filter((h) => h.checked).length} of {habits.length} done
                </span>
              ) : undefined
            }
          >
            {habits.length === 0 ? (
              <EmptyState
                icon={Repeat}
                text="No habits due today"
                // Plan is a desktop screen; the phone has no action to offer here.
                action={isPhone ? undefined : <Button onClick={() => navigate({ name: 'plan' })}>Open Plan</Button>}
              />
            ) : (
              <div className={styles.habits}>
                {habits.map((habit) => (
                  <div key={habit.id} className={styles.habitRow}>
                    <button
                      type="button"
                      className={`${styles.habit} ${habit.checked ? styles.checked : ''}`}
                      aria-pressed={habit.checked}
                      onClick={() => toggleHabit(habit)}
                    >
                      <span className={styles.habitBox} aria-hidden="true">
                        {habit.checked && <Check />}
                      </span>
                      <span className={styles.habitTitle}>{habit.title}</span>
                      {habit.label && (
                        <span
                          className={styles.habitLabel}
                          style={habit.projectColor ? ({ '--pc': habit.projectColor } as CSSProperties) : undefined}
                        >
                          {habit.projectColor && <span className={styles.habitDot} aria-hidden="true" />}
                          {habit.label}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.habitStart}
                      aria-label={`Start focus on ${habit.title}`}
                      title="Start focus"
                      onClick={() => void start({ habitId: habit.id })}
                    >
                      <Play aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Tile>

          <Tile title={<h2 className={styles.tileTitle}>To do</h2>} actions={<span className={styles.count}>{todo.length}</span>}>
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
              <div className={styles.todoList}>
                <TaskList
                  tasks={todo.map((item) => item.task)}
                  label="To do"
                  rowProps={(task) => ({
                    compact: true,
                    importance: itemByTask.get(task.id)?.importance,
                    context: itemByTask.get(task.id)?.context ?? undefined,
                    projectColor: itemByTask.get(task.id)?.projectColor,
                    projectName: itemByTask.get(task.id)?.projectTitle ?? undefined,
                    onStartFocus: () => void start({ taskId: task.id }),
                  })}
                />
              </div>
            )}
          </Tile>

          {done.length > 0 && (
            <Tile title={<h2 className={styles.tileTitle}>Done today</h2>} actions={<span className={styles.count}>{done.length}</span>}>
              <div className={styles.todoList}>
                {done.map((item) => (
                  <ListRow
                    key={item.task.id}
                    muted
                    leading={
                      <Checkbox
                        checked
                        label={<span className="visually-hidden">Reopen {item.task.title}</span>}
                        onChange={() => void reopenTask(db, clock, item.task.id)}
                      />
                    }
                    title={item.task.title}
                    onOpen={() => navigate({ name: 'task', id: item.task.id })}
                    meta={
                      <>
                        {item.projectTitle && item.projectColor ? (
                          <Chip projectColor={item.projectColor}>{item.projectTitle}</Chip>
                        ) : (
                          item.context && <span>{item.context}</span>
                        )}
                        {item.task.completedAt && <span>{timeOf(item.task.completedAt)}</span>}
                      </>
                    }
                  />
                ))}
              </div>
            </Tile>
          )}
        </div>

        {!isPhone && (
          <aside className={styles.side}>
            <TodayTile onLogWork={() => setLogging(true)} />
            <div className={styles.sideHead}>
              <h2 className={styles.tileTitle}>Active projects</h2>
              <span className={styles.count}>{projects.length}</span>
            </div>
            <div className={styles.sideBody}>
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  text="No active projects"
                  action={<Button onClick={() => navigate({ name: 'plan' })}>Open Plan</Button>}
                />
              ) : (
                <div className={styles.projects}>
                  {projects.map(({ view, area, nextSteps }) => (
                    <Tile
                      key={view.project.id}
                      as="article"
                      color={view.color}
                      tinted
                      title={
                        <button
                          type="button"
                          className={styles.projectTitle}
                          onClick={() => navigate({ name: 'project', id: view.project.id })}
                        >
                          {area && (
                            <span
                              className={styles.dot}
                              style={{ '--area-color': area.color } as CSSProperties}
                              title={area.name}
                              aria-hidden="true"
                            />
                          )}
                          {view.project.title}
                        </button>
                      }
                      actions={view.deadline && <DeadlineBadge deadline={view.deadline.date} inherited={view.deadline.inherited} />}
                    >
                      {nextSteps.length > 0 && (
                        <AnimatedList
                          items={nextSteps}
                          getKey={(task: Task) => task.id}
                          label={`Next steps of ${view.project.title}`}
                          renderItem={(task: Task) => (
                            <div className={styles.step}>
                              <Checkbox
                                checked={false}
                                label={<span className="visually-hidden">Complete {task.title}</span>}
                                onChange={() => void complete(task)}
                              />
                              <button type="button" className={styles.stepOpen} onClick={() => navigate({ name: 'task', id: task.id })}>
                                {task.title}
                              </button>
                            </div>
                          )}
                        />
                      )}
                    </Tile>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
      {creating && <TaskSheet onClose={() => setCreating(false)} />}
      {logging && <LogWorkSheet onClose={() => setLogging(false)} />}
    </>
  );
}
