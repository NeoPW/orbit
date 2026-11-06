import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { goals, habits, projects, tasks, type GoalStatus, type ProjectStatus } from '../../../core/db/schema.ts';
import { isSlot, pickSlot, projectColor } from '../../../core/ui/colors.ts';
import { effectiveDeadline, type EffectiveDeadline } from '../domain/projects.ts';

export type Project = typeof projects.$inferSelect;

export interface ProjectInput {
  title: string;
  description: string;
  areaId: string | null;
  goalId: string | null;
  /** 1 to 5. */
  importance: number;
  /** `yyyy-mm-dd`, or null. */
  deadline: string | null;
  status: ProjectStatus;
  /** Slot key (`pc0`..`pc7`). On create, absent or null picks the least used slot; on update, absent keeps the stored one. */
  color?: string | null;
}

/** A project with what its screens need from its goal. */
export interface ProjectView {
  project: Project;
  /** End date and status of the goal it serves, when it has one. */
  goalEnd: string | null;
  goalStatus: GoalStatus | null;
  goalTitle: string | null;
  deadline: EffectiveDeadline | null;
  /** CSS colour (`var(--pcN)`): the stored slot, else one derived from the id. */
  color: string;
}

function view(project: Project, goal: { endDate: string | null; status: GoalStatus; title: string } | null): ProjectView {
  const goalEnd = goal?.endDate ?? null;
  return {
    project,
    goalEnd,
    goalStatus: goal?.status ?? null,
    goalTitle: goal?.title ?? null,
    deadline: effectiveDeadline({ deadline: project.deadline, goalEnd }),
    color: projectColor(project),
  };
}

async function loadViews(db: Db, rows: Project[]): Promise<ProjectView[]> {
  const goalIds = [...new Set(rows.flatMap((p) => (p.goalId ? [p.goalId] : [])))];
  const found = goalIds.length
    ? await db
        .select()
        .from(goals)
        .where(and(inArray(goals.id, goalIds), notDeleted(goals)))
    : [];
  const byId = new Map(found.map((g) => [g.id, g]));
  return rows.map((p) => view(p, p.goalId ? (byId.get(p.goalId) ?? null) : null));
}

const byCreated = [projects.createdAt] as const;

/** One project of any status; undefined when missing or deleted. */
export async function getProject(db: Db, id: string): Promise<ProjectView | undefined> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), notDeleted(projects)));
  return (await loadViews(db, rows))[0];
}

/** Projects with one of the statuses, oldest first (sort with the domain order). */
export async function listProjectsByStatus(db: Db, ...statuses: ProjectStatus[]): Promise<ProjectView[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(inArray(projects.status, statuses), notDeleted(projects)))
    .orderBy(...byCreated);
  return loadViews(db, rows);
}

/** Projects serving a goal; all statuses unless some are given. */
export async function listProjectsByGoal(db: Db, goalId: string, ...statuses: ProjectStatus[]): Promise<ProjectView[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.goalId, goalId), statuses.length ? inArray(projects.status, statuses) : undefined, notDeleted(projects)))
    .orderBy(...byCreated);
  return loadViews(db, rows);
}

/** Projects of a status (default active) that serve no goal. */
export async function listProjectsWithoutGoal(db: Db, status: ProjectStatus = 'active'): Promise<ProjectView[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.status, status), isNull(projects.goalId), notDeleted(projects)))
    .orderBy(...byCreated);
  return loadViews(db, rows);
}

function completedAtFor(status: ProjectStatus, previous: Project | undefined, clock: Clock): string | null {
  if (status !== 'completed') return null;
  return previous?.status === 'completed' && previous.completedAt ? previous.completedAt : clock().toISOString();
}

function clean(input: ProjectInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    areaId: input.areaId,
    goalId: input.goalId,
    importance: input.importance,
    deadline: input.deadline,
    status: input.status,
  };
}

/** Creates a project; returns its id. */
export async function createProject(db: Db, clock: Clock, input: ProjectInput): Promise<string> {
  const fields = createFields(clock);
  const used = await db.select({ color: projects.color }).from(projects).where(notDeleted(projects));
  const color = isSlot(input.color) ? input.color : pickSlot(used.map((p) => p.color));
  await db.insert(projects).values({
    ...fields,
    ...clean(input),
    color,
    completedAt: completedAtFor(input.status, undefined, clock),
  });
  return fields.id;
}

export async function updateProject(db: Db, clock: Clock, id: string, input: ProjectInput): Promise<void> {
  const [previous] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), notDeleted(projects)));
  if (!previous) return;
  await db
    .update(projects)
    .set({
      ...updateFields(clock),
      ...clean(input),
      ...(isSlot(input.color) ? { color: input.color } : {}),
      completedAt: completedAtFor(input.status, previous, clock),
    })
    .where(eq(projects.id, id));
}

/** Sets the status; `completed` sets `completed_at` to now, any other status clears it. */
export async function setProjectStatus(db: Db, clock: Clock, id: string, status: ProjectStatus): Promise<void> {
  const [previous] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), notDeleted(projects)));
  if (!previous) return;
  await db
    .update(projects)
    .set({
      ...updateFields(clock),
      status,
      completedAt: completedAtFor(status, previous, clock),
    })
    .where(eq(projects.id, id));
}

/** Soft-deletes the project and its tasks and clears `project_id` on its habits, in one batch. */
export async function deleteProject(db: Db, clock: Clock, id: string): Promise<void> {
  await db.batch([
    db.update(projects).set(deleteFields(clock)).where(eq(projects.id, id)),
    db
      .update(tasks)
      .set(deleteFields(clock))
      .where(and(eq(tasks.projectId, id), notDeleted(tasks))),
    db
      .update(habits)
      .set({ ...updateFields(clock), projectId: null })
      .where(and(eq(habits.projectId, id), notDeleted(habits))),
  ]);
}
