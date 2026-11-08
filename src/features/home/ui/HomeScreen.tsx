import { Check, FolderKanban, ListTodo, NotebookPen, Play, Plus, Repeat } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { withShortcut } from '../../../app/shortcuts/keys.ts';
import { useScreenShortcuts } from '../../../app/shortcuts/screen-keys.ts';
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
import { useOpenTask } from '../../tasks/ui/TaskPopup.tsx';
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
  const openTask = useOpenTask();
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
  // One keyboard highlight on Home: a To do task or a habit chip.
  const [highlight, setHighlight] = useState<{ list: 'task' | 'habit'; index: number } | null>(null);
  const todoTasks = data?.todo.map((item) => item.task) ?? [];
  const habitItems = data?.habits ?? [];
  const listLength = (list: 'task' | 'habit') => (list === 'task' ? todoTasks.length : habitItems.length);
  const highlighted =
    highlight === null || listLength(highlight.list) === 0
      ? null
      : { ...highlight, index: Math.min(highlight.index, listLength(highlight.list) - 1) };
  const highlightedTask = highlighted?.list === 'task' ? todoTasks[highlighted.index] : undefined;
  const highlightedHabit = highlighted?.list === 'habit' ? habitItems[highlighted.index] : undefined;

  // A click anywhere ends keyboard navigation.
  useEffect(() => {
    if (highlight === null) return;
    const clear = () => setHighlight(null);
    window.addEventListener('mousedown', clear);
    return () => window.removeEventListener('mousedown', clear);
  }, [highlight]);

  // J/K and up/down through the To do list (wrapping), left/right through the habits, 1–9 highlight a task and
  // Shift+1–9 a habit; Space, X and Enter act on what is highlighted (see openspec keyboard-shortcuts).
  useScreenShortcuts((match) => {
    const tasks = todoTasks.length;
    const habitCount = habitItems.length;
    const at = highlighted;
    switch (match.action) {
      // Up and down wrap around the To do list; from a habit they start at the first task.
      case 'todo-next':
        if (tasks === 0) return;
        return setHighlight({ list: 'task', index: at?.list === 'task' ? (at.index + 1) % tasks : 0 });
      case 'todo-prev':
        if (tasks === 0) return;
        return setHighlight({ list: 'task', index: at?.list === 'task' ? (at.index - 1 + tasks) % tasks : 0 });
      case 'habit-prev':
      case 'habit-next': {
        if (habitCount === 0) return;
        const step = match.action === 'habit-next' ? 1 : -1;
        const index = at?.list === 'habit' ? Math.min(Math.max(at.index + step, 0), habitCount - 1) : 0;
        return setHighlight({ list: 'habit', index });
      }
      case 'todo-select-n':
        return (match.index ?? -1) < tasks ? setHighlight({ list: 'task', index: match.index ?? 0 }) : undefined;
      case 'habit-select-n':
        return (match.index ?? -1) < habitCount ? setHighlight({ list: 'habit', index: match.index ?? 0 }) : undefined;
      case 'todo-start':
        if (highlightedTask) return void start({ taskId: highlightedTask.id });
        if (highlightedHabit) return void start({ habitId: highlightedHabit.id });
        return;
      case 'todo-complete':
      case 'todo-open':
        if (highlightedTask)
          return match.action === 'todo-complete' ? void complete(highlightedTask) : openTask(highlightedTask.id);
        if (highlightedHabit) {
          void (highlightedHabit.checked
            ? uncheckHabit(db, clock, highlightedHabit.id, today)
            : checkHabit(db, clock, highlightedHabit.id, today));
        }
        return;
    }
  });

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
              <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)} title={withShortcut('New task', 'new-task')}>
                New task
              </Button>
              <Button icon={<NotebookPen />} onClick={() => setLogging(true)} title={withShortcut('Log work', 'log-work')}>
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
                  <div
                    key={habit.id}
                    ref={highlightedHabit?.id === habit.id ? (node) => node?.scrollIntoView({ block: 'nearest' }) : undefined}
                    className={`${styles.habitRow} ${highlightedHabit?.id === habit.id ? styles.highlighted : ''}`}
                    data-highlighted={highlightedHabit?.id === habit.id || undefined}
                  >
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
                    highlighted: highlightedTask?.id === task.id,
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
                    onOpen={() => openTask(item.task.id)}
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
                              <button type="button" className={styles.stepOpen} onClick={() => openTask(task.id)}>
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
