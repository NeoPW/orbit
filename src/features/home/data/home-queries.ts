import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habits, projects, tasks, type Area } from '../../../core/db/schema.ts';
import { addDays } from '../../../core/dates/today.ts';
import { projectColor } from '../../../core/ui/colors.ts';
import { localRange } from '../../timeline/domain/day-timeline.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listChecksSince } from '../../habits/data/habits-repository.ts';
import { isDue, weekStartOf } from '../../habits/domain/habits.ts';
import { listProjectsByStatus, type ProjectView } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { sortOpenTasks } from '../../tasks/domain/tasks.ts';
import { listTodoTasks, toViews, type Task, type TaskView } from '../../tasks/data/tasks-repository.ts';

export interface TodoItem {
  task: Task;
  /** The title of its project, else of its goal. */
  context: string | null;
  /** The title of its project, null when it has none. */
  projectTitle: string | null;
  /** CSS colour of its project; null for a standalone task or a goal task. */
  projectColor: string | null;
}

/**
 * To do: open next steps of active projects and open tasks outside projects
 * (standalone or assigned to a goal), in To do order (manual positions first, then time added).
 */
export async function listTodo(db: Db): Promise<TodoItem[]> {
  return toItems(db, await listTodoTasks(db));
}

/**
 * "Show N more": open tasks of active projects that are not next steps, grouped by project in the order of the
 * active projects, each project's tasks in its own task order.
 */
export async function listMoreTodo(db: Db): Promise<TodoItem[]> {
  const [{ open }, views] = await Promise.all([loadOpen(db), listProjectsByStatus(db, 'active')]);
  const listed = sortViewsForPlan(views).flatMap((view) =>
    sortOpenTasks(open.filter((t) => t.projectId === view.project.id && !t.isNextStep)),
  );
  return toItems(db, listed);
}

async function loadOpen(db: Db): Promise<{ open: Task[]; activeIds: Set<string> }> {
  const [open, active] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, 'open'), notDeleted(tasks))),
    db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.status, 'active'), notDeleted(projects))),
  ]);
  return { open, activeIds: new Set(active.map((p) => p.id)) };
}

async function toItems(db: Db, listed: Task[]): Promise<TodoItem[]> {
  const byId = new Map((await toViews(db, listed)).map((view) => [view.task.id, view]));
  return listed.map((task) => {
    const view = byId.get(task.id) as TaskView;
    return {
      task,
      context: view.projectTitle ?? view.goalTitle,
      projectTitle: view.projectTitle,
      projectColor: view.projectColor,
    };
  });
}

export interface DoneItem {
  task: Task;
  /** The title of its project, else of its goal. */
  context: string | null;
  projectTitle: string | null;
  projectColor: string | null;
}

/** Tasks completed on the local day `today`, the most recently completed first. */
export async function listDoneToday(db: Db, today: string): Promise<DoneItem[]> {
  const { from, to } = localRange(today, addDays(today, 1));
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, 'done'), notDeleted(tasks), gte(tasks.completedAt, from), lt(tasks.completedAt, to)))
    .orderBy(desc(tasks.completedAt));
  const views = await toViews(db, rows);
  return views.map((view) => ({
    task: view.task,
    context: view.projectTitle ?? view.goalTitle,
    projectTitle: view.projectTitle,
    projectColor: view.projectColor,
  }));
}

export interface ActiveProjectItem {
  view: ProjectView;
  area: Area | null;
  /** The first open tasks in the project's open-task order (next steps first), at most CARD_TASKS. */
  tasks: Task[];
  /** All open tasks of the project, for "+N more". */
  openCount: number;
}

/** How many open tasks a project card on Home shows. */
export const CARD_TASKS = 3;

/** Active projects by deadline, then time added, each with its first open tasks. */
export async function listActiveProjects(db: Db): Promise<ActiveProjectItem[]> {
  const [views, areas, open] = await Promise.all([
    listProjectsByStatus(db, 'active'),
    listAreas(db),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, 'open'), notDeleted(tasks))),
  ]);
  const sorted = sortViewsForPlan(views);
  const areaById = new Map(areas.map((a) => [a.id, a]));
  return sorted.map((view) => {
    const own = sortOpenTasks(
      open.filter((t) => t.projectId === view.project.id),
      { nextStepsFirst: true },
    );
    return {
      view,
      area: view.project.areaId ? (areaById.get(view.project.areaId) ?? null) : null,
      tasks: own.slice(0, CARD_TASKS),
      openCount: own.length,
    };
  });
}

export interface HabitOption {
  id: string;
  title: string;
  projectId: string | null;
  projectTitle: string | null;
  projectColor: string | null;
}

/** All active habits (not only those due today), for the focus field's suggestions. */
export async function listActiveHabitOptions(db: Db): Promise<HabitOption[]> {
  const [rows, projectRows] = await Promise.all([
    db
      .select()
      .from(habits)
      .where(and(eq(habits.active, true), notDeleted(habits)))
      .orderBy(habits.createdAt),
    db.select({ id: projects.id, title: projects.title, color: projects.color }).from(projects).where(notDeleted(projects)),
  ]);
  const byId = new Map(projectRows.map((p) => [p.id, p]));
  return rows.map((habit) => {
    const project = habit.projectId ? byId.get(habit.projectId) : undefined;
    return {
      id: habit.id,
      title: habit.title,
      projectId: habit.projectId,
      projectTitle: project?.title ?? null,
      projectColor: project ? projectColor(project) : null,
    };
  });
}

export interface HabitItem {
  id: string;
  title: string;
  /** Title of the linked project, else of the linked goal. */
  label: string | null;
  /** CSS colour of the linked project; null when the habit has no project. */
  projectColor: string | null;
  checked: boolean;
}

/** Active habits that are due today or were checked today, in creation order. */
export async function listHabitsForToday(db: Db, today: string): Promise<HabitItem[]> {
  const [rows, checks, projectRows, goalRows] = await Promise.all([
    db
      .select()
      .from(habits)
      .where(and(eq(habits.active, true), notDeleted(habits)))
      .orderBy(habits.createdAt),
    listChecksSince(db, weekStartOf(today)),
    db.select({ id: projects.id, title: projects.title, color: projects.color }).from(projects).where(notDeleted(projects)),
    db.select({ id: goals.id, title: goals.title }).from(goals).where(notDeleted(goals)),
  ]);
  const projectTitle = new Map(projectRows.map((p) => [p.id, p.title]));
  const projectCss = new Map(projectRows.map((p) => [p.id, projectColor(p)]));
  const goalTitle = new Map(goalRows.map((g) => [g.id, g.title]));
  const items: HabitItem[] = [];
  for (const habit of rows) {
    const dates = checks.filter((c) => c.habitId === habit.id).map((c) => c.date);
    const checked = dates.includes(today);
    if (!checked && !isDue(habit, today, dates)) continue;
    items.push({
      id: habit.id,
      title: habit.title,
      label: (habit.projectId && projectTitle.get(habit.projectId)) || (habit.goalId && goalTitle.get(habit.goalId)) || null,
      projectColor: (habit.projectId && projectCss.get(habit.projectId)) || null,
      checked,
    });
  }
  return items;
}
