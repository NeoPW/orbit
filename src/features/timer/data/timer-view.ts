import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { projectColor } from '../../../core/ui/colors.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { habits, projects, tasks } from '../../../core/db/schema.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { listChecksSince } from '../../habits/data/habits-repository.ts';
import { listOpenNextSteps } from '../../tasks/data/tasks-repository.ts';
import { promptAfterStop } from '../domain/timer.ts';
import { getTimer, type Timer } from './timer-repository.ts';

/** The running timer with what it runs for; the target may be gone or done, the timer keeps running. */
export interface TimerView {
  timer: Timer;
  title: string;
  /** A task's notes or a project's description. */
  notes: string;
  /** The project's name, for its chip; null for a task outside a project. */
  projectName: string | null;
  /** The project's colour as a ready CSS colour; null for a task outside a project. */
  projectColor: string | null;
  /** The habit the timer runs for, and whether it is checked today (the stop dialog offers to check it). */
  habit: { id: string; checkedToday: boolean } | null;
}

export async function getTimerView(db: Db): Promise<TimerView | null> {
  const timer = await getTimer(db);
  if (!timer) return null;
  const [task] = timer.taskId ? await db.select().from(tasks).where(eq(tasks.id, timer.taskId)) : [];
  const [habit] = timer.habitId && !timer.taskId ? await db.select().from(habits).where(eq(habits.id, timer.habitId)) : [];
  const projectId = timer.taskId ? task?.projectId : timer.habitId ? habit?.projectId : timer.projectId;
  const [project] = projectId ? await db.select().from(projects).where(eq(projects.id, projectId)) : [];
  const colours = project ? { projectName: project.title, projectColor: projectColor(project) } : { projectName: null, projectColor: null };
  if (timer.taskId) return { timer, title: task?.title ?? 'Deleted task', notes: task?.notes ?? '', ...colours, habit: null };
  if (timer.habitId) {
    const checkedToday = habit ? (await listChecksSince(db, localToday(), habit.id)).length > 0 : true;
    return {
      timer,
      title: habit && habit.deletedAt === null ? habit.title : 'Deleted habit',
      notes: '',
      ...colours,
      habit: { id: timer.habitId, checkedToday },
    };
  }
  return { timer, title: project?.title ?? 'Deleted project', notes: project?.description ?? '', ...colours, habit: null };
}

/** The task to show "What's the next step?" for after stopping this timer, or null. */
export async function nextStepPromptAfterStop(db: Db, timer: Timer): Promise<{ id: string; title: string; projectId: string } | null> {
  if (!timer.taskId) return null;
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, timer.taskId), notDeleted(tasks)));
  if (!task?.projectId) return null;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, task.projectId), notDeleted(projects)));
  const steps = project ? await listOpenNextSteps(db, project.id) : [];
  const ask = promptAfterStop({
    task: { status: task.status, completedAt: task.completedAt, projectId: task.projectId },
    projectActive: project?.status === 'active',
    openNextSteps: steps.length,
    startedAt: timer.startedAt,
  });
  return ask ? { id: task.id, title: task.title, projectId: task.projectId } : null;
}
