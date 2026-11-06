import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, newId, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { goals, logEntries, projects, tasks } from '../../../core/db/schema.ts';
import { projectColor } from '../../../core/ui/colors.ts';
import { sortOpenTasks } from '../domain/tasks.ts';

export type Task = typeof tasks.$inferSelect;

export interface TaskInput {
  title: string;
  notes: string;
  /** `yyyy-mm-dd`, or null. */
  dueDate: string | null;
  /** 1 to 5, or null to inherit. */
  importance: number | null;
  /** At most one assignment is kept; a project wins over a goal. */
  projectId: string | null;
  goalId: string | null;
}

/** The choice in the "What's the next step?" prompt (cancel never reaches the repository). */
export type NextStepChoice = { kind: 'direct' } | { kind: 'new'; title: string } | { kind: 'pick'; taskIds: string[] } | { kind: 'skip' };

/** What undo needs to restore a completed task. */
export interface CompletedTask {
  taskId: string;
  logEntryId: string;
  /** Whether the task was a next step before completing. */
  wasNextStep: boolean;
  /** The task created by a `new` choice, if any. */
  createdTaskId: string | null;
}

/** A task with the data its rank and display need from its project or goal. */
export interface TaskView {
  task: Task;
  projectTitle: string | null;
  /** CSS colour of its project (`var(--pcN)`); null for a task outside a project. */
  projectColor: string | null;
  projectImportance: number | null;
  projectDeadline: string | null;
  /** End date of the project's goal (for the project's effective deadline). */
  projectGoalEnd: string | null;
  goalTitle: string | null;
  /** End date of the goal the task is assigned to directly. */
  goalEnd: string | null;
}

function assignment(input: { projectId: string | null; goalId: string | null }) {
  return input.projectId ? { projectId: input.projectId, goalId: null } : { projectId: null, goalId: input.goalId };
}

async function loadTask(db: Db, id: string): Promise<Task | undefined> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), notDeleted(tasks)));
  return row;
}

export async function toViews(db: Db, rows: Task[]): Promise<TaskView[]> {
  const projectIds = [...new Set(rows.flatMap((t) => (t.projectId ? [t.projectId] : [])))];
  const projectRows = projectIds.length ? await db.select().from(projects).where(inArray(projects.id, projectIds)) : [];
  const goalIds = [...new Set([...rows.flatMap((t) => (t.goalId ? [t.goalId] : [])), ...projectRows.flatMap((p) => (p.goalId ? [p.goalId] : []))])];
  const goalRows = goalIds.length ? await db.select().from(goals).where(inArray(goals.id, goalIds)) : [];
  const projectById = new Map(projectRows.map((p) => [p.id, p]));
  const goalById = new Map(goalRows.map((g) => [g.id, g]));
  return rows.map((task) => {
    const project = task.projectId ? projectById.get(task.projectId) : undefined;
    const projectGoal = project?.goalId ? goalById.get(project.goalId) : undefined;
    const goal = task.goalId ? goalById.get(task.goalId) : undefined;
    return {
      task,
      projectTitle: project?.title ?? null,
      projectColor: project ? projectColor(project) : null,
      projectImportance: project?.importance ?? null,
      projectDeadline: project?.deadline ?? null,
      projectGoalEnd: projectGoal?.endDate ?? null,
      goalTitle: goal?.title ?? null,
      goalEnd: goal?.endDate ?? null,
    };
  });
}

/** One task of any status; undefined when missing or deleted. */
export async function getTask(db: Db, id: string): Promise<TaskView | undefined> {
  const row = await loadTask(db, id);
  return row ? (await toViews(db, [row]))[0] : undefined;
}

/** A project's open tasks in open-task order, next steps first. */
export async function listOpenTasksOfProject(db: Db, projectId: string): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, 'open'), notDeleted(tasks)));
  return sortOpenTasks(rows, { nextStepsFirst: true });
}

/** A project's done tasks, most recently completed first. */
export async function listDoneTasksOfProject(db: Db, projectId: string): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, 'done'), notDeleted(tasks)));
  return rows.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

/** The project's open next-step tasks. */
export async function listOpenNextSteps(db: Db, projectId: string): Promise<Task[]> {
  return (await listOpenTasksOfProject(db, projectId)).filter((t) => t.isNextStep);
}

/** Open tasks assigned to a goal, in open-task order. */
export async function listOpenTasksOfGoal(db: Db, goalId: string): Promise<Task[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.goalId, goalId), eq(tasks.status, 'open'), notDeleted(tasks)));
  return sortOpenTasks(rows);
}

/** Creates an open task, never a next step; returns its id. */
/** All open tasks (not only the To do list) with their project's title and colour, for suggestions. */
export async function listOpenTasks(db: Db): Promise<TaskView[]> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, 'open'), notDeleted(tasks)))
    .orderBy(tasks.title);
  return toViews(db, rows);
}

export async function createTask(db: Db, clock: Clock, input: TaskInput): Promise<string> {
  const fields = createFields(clock);
  await db.insert(tasks).values({
    ...fields,
    title: input.title.trim(),
    notes: input.notes.trim(),
    dueDate: input.dueDate,
    importance: input.importance,
    ...assignment(input),
    status: 'open',
    isNextStep: false,
  });
  return fields.id;
}

/** Updates a task; a task that leaves its project (or has none) is no longer a next step. */
export async function updateTask(db: Db, clock: Clock, id: string, input: TaskInput): Promise<void> {
  const previous = await loadTask(db, id);
  if (!previous) return;
  const assigned = assignment(input);
  await db
    .update(tasks)
    .set({
      ...updateFields(clock),
      title: input.title.trim(),
      notes: input.notes.trim(),
      dueDate: input.dueDate,
      importance: input.importance,
      ...assigned,
      isNextStep: assigned.projectId !== null && assigned.projectId === previous.projectId ? previous.isNextStep : false,
    })
    .where(eq(tasks.id, id));
}

/** Marks or unmarks an open task of a project as next step; other tasks are left unchanged. */
export async function setNextStep(db: Db, clock: Clock, id: string, isNextStep: boolean): Promise<void> {
  const task = await loadTask(db, id);
  if (!task || !task.projectId || (isNextStep && task.status !== 'open')) return;
  await db
    .update(tasks)
    .set({ ...updateFields(clock), isNextStep })
    .where(eq(tasks.id, id));
}

/**
 * Completes an open task in one batch: done, log entry (source `task`), and
 * the chosen next steps. Returns what undo needs, or undefined when the task
 * is not open. `new` and `pick` apply only to a task of a project.
 */
export async function completeTask(db: Db, clock: Clock, id: string, choice: NextStepChoice): Promise<CompletedTask | undefined> {
  const task = await loadTask(db, id);
  if (!task || task.status !== 'open') return undefined;
  const now = clock().toISOString();
  const logEntryId = newId();
  let createdTaskId: string | null = null;

  const writes = [
    db
      .update(tasks)
      .set({
        ...updateFields(clock),
        status: 'done' as const,
        completedAt: now,
        isNextStep: false,
      })
      .where(eq(tasks.id, id)),
    db.insert(logEntries).values({
      ...createFields(clock, logEntryId),
      projectId: task.projectId,
      goalId: task.goalId,
      taskId: id,
      occurredAt: now,
      durationMinutes: null,
      note: task.title,
      source: 'task',
    }),
  ];

  if (task.projectId) {
    if (choice.kind === 'new' && choice.title.trim()) {
      const fields = createFields(clock);
      createdTaskId = fields.id;
      writes.push(
        db.insert(tasks).values({
          ...fields,
          title: choice.title.trim(),
          projectId: task.projectId,
          status: 'open',
          isNextStep: true,
        }) as never,
      );
    } else if (choice.kind === 'pick' && choice.taskIds.length > 0) {
      writes.push(
        db
          .update(tasks)
          .set({ ...updateFields(clock), isNextStep: true })
          .where(and(inArray(tasks.id, choice.taskIds), eq(tasks.projectId, task.projectId), eq(tasks.status, 'open'), notDeleted(tasks))) as never,
      );
    }
  }

  await db.batch(writes as [(typeof writes)[0], ...(typeof writes)[number][]]);
  return {
    taskId: id,
    logEntryId,
    wasNextStep: task.isNextStep,
    createdTaskId,
  };
}

/** Undoes completing: reopens the task, deletes its log entry and restores the next-step flag. Chosen next steps stay. */
export async function undoCompleteTask(db: Db, clock: Clock, completed: Pick<CompletedTask, 'taskId' | 'logEntryId' | 'wasNextStep'>): Promise<void> {
  await db.batch([
    db
      .update(tasks)
      .set({
        ...updateFields(clock),
        status: 'open',
        completedAt: null,
        isNextStep: completed.wasNextStep,
      })
      .where(eq(tasks.id, completed.taskId)),
    db.update(logEntries).set(deleteFields(clock)).where(eq(logEntries.id, completed.logEntryId)),
  ]);
}

/** Reopens a done task; its log entries stay and it is not a next step. */
export async function reopenTask(db: Db, clock: Clock, id: string): Promise<void> {
  await db
    .update(tasks)
    .set({ ...updateFields(clock), status: 'open', completedAt: null })
    .where(and(eq(tasks.id, id), notDeleted(tasks)));
}

/** Soft-deletes a task; its log entries remain. */
export async function deleteTask(db: Db, clock: Clock, id: string): Promise<void> {
  await db.update(tasks).set(deleteFields(clock)).where(eq(tasks.id, id));
}

/**
 * Applies the "What's the next step?" choice for a task that is already completed
 * (after a focus session): creates the new next step or marks the picked tasks, in one batch.
 */
export async function applyNextStepChoice(db: Db, clock: Clock, projectId: string, choice: NextStepChoice): Promise<void> {
  if (choice.kind === 'new' && choice.title.trim()) {
    await db.insert(tasks).values({
      ...createFields(clock),
      title: choice.title.trim(),
      projectId,
      status: 'open',
      isNextStep: true,
    });
  } else if (choice.kind === 'pick' && choice.taskIds.length > 0) {
    await db
      .update(tasks)
      .set({ ...updateFields(clock), isNextStep: true })
      .where(and(inArray(tasks.id, choice.taskIds), eq(tasks.projectId, projectId), eq(tasks.status, 'open'), notDeleted(tasks)));
  }
}
