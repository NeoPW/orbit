import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { goals, habits, projects, tasks, type Area } from '../../../core/db/schema.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { listChecksSince } from '../../habits/data/habits-repository.ts';
import { isDue, weekStartOf } from '../../habits/domain/habits.ts';
import { listProjectsByStatus, type ProjectView } from '../../projects/data/projects-repository.ts';
import { sortByScore } from '../../projects/domain/projects.ts';
import { compareByRank, effectiveImportance, type RankInput } from '../../tasks/domain/tasks.ts';
import { toViews, type Task, type TaskView } from '../../tasks/data/tasks-repository.ts';

/** What the rank of a task view needs. */
export function rankInput(view: TaskView): RankInput {
  const { task } = view;
  return {
    importance: task.importance,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    projectImportance: view.projectImportance,
    projectDeadline: view.projectDeadline,
    projectGoalEnd: view.projectGoalEnd,
    goalEnd: view.goalEnd,
  };
}

export interface TodoItem {
  task: Task;
  /** The title of its project, else of its goal. */
  context: string | null;
  importance: { value: number; inherited: boolean };
}

/**
 * To do: open next steps of active projects and open tasks outside projects
 * (standalone or assigned to a goal), ranked by importance × urgency.
 */
export async function listTodo(db: Db, today: string): Promise<TodoItem[]> {
  const [open, active] = await Promise.all([
    db.select().from(tasks).where(and(eq(tasks.status, 'open'), notDeleted(tasks))),
    db.select({ id: projects.id }).from(projects).where(and(eq(projects.status, 'active'), notDeleted(projects))),
  ]);
  const activeIds = new Set(active.map((p) => p.id));
  const listed = open.filter((t) => (t.projectId ? t.isNextStep && activeIds.has(t.projectId) : true));
  const views = await toViews(db, listed);
  const compare = compareByRank(today);
  return views
    .sort((a, b) => compare(rankInput(a), rankInput(b)))
    .map((view) => ({
      task: view.task,
      context: view.projectTitle ?? view.goalTitle,
      importance: effectiveImportance({ importance: view.task.importance, projectImportance: view.projectImportance }),
    }));
}

export interface ActiveProjectItem {
  view: ProjectView;
  area: Area | null;
  /** Open next steps, oldest due date first. */
  nextSteps: Task[];
}

/** Active projects by score, each with its open next steps. */
export async function listActiveProjects(db: Db, today: string): Promise<ActiveProjectItem[]> {
  const [views, areas, steps] = await Promise.all([
    listProjectsByStatus(db, 'active'),
    listAreas(db),
    db.select().from(tasks).where(and(eq(tasks.status, 'open'), eq(tasks.isNextStep, true), notDeleted(tasks))),
  ]);
  const sorted = sortByScore(
    views.map((view) => ({ view, title: view.project.title, importance: view.project.importance, deadline: view.project.deadline, goalEnd: view.goalEnd })),
    today,
  );
  const areaById = new Map(areas.map((a) => [a.id, a]));
  return sorted.map(({ view }) => ({
    view,
    area: view.project.areaId ? (areaById.get(view.project.areaId) ?? null) : null,
    nextSteps: steps
      .filter((t) => t.projectId === view.project.id)
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || a.createdAt.localeCompare(b.createdAt)),
  }));
}

export interface HabitItem {
  id: string;
  title: string;
  /** Title of the linked project, else of the linked goal. */
  label: string | null;
  checked: boolean;
}

/** Active habits that are due today or were checked today, in creation order. */
export async function listHabitsForToday(db: Db, today: string): Promise<HabitItem[]> {
  const [rows, checks, projectRows, goalRows] = await Promise.all([
    db.select().from(habits).where(and(eq(habits.active, true), notDeleted(habits))).orderBy(habits.createdAt),
    listChecksSince(db, weekStartOf(today)),
    db.select({ id: projects.id, title: projects.title }).from(projects).where(notDeleted(projects)),
    db.select({ id: goals.id, title: goals.title }).from(goals).where(notDeleted(goals)),
  ]);
  const projectTitle = new Map(projectRows.map((p) => [p.id, p.title]));
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
      checked,
    });
  }
  return items;
}
