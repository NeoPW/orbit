import { and, eq } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { notDeleted } from '../../../core/db/records.ts';
import { projects, tasks } from '../../../core/db/schema.ts';
import { listOpenNextSteps } from '../../tasks/data/tasks-repository.ts';
import { promptAfterStop } from '../domain/timer.ts';
import { getTimer, type Timer } from './timer-repository.ts';

/** The running timer with what it runs for; the target may be gone or done, the timer keeps running. */
export interface TimerView {
  timer: Timer;
  title: string;
  /** A task's notes or a project's description. */
  notes: string;
}

export async function getTimerView(db: Db): Promise<TimerView | null> {
  const timer = await getTimer(db);
  if (!timer) return null;
  if (timer.taskId) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, timer.taskId));
    return { timer, title: task?.title ?? 'Deleted task', notes: task?.notes ?? '' };
  }
  const [project] = timer.projectId ? await db.select().from(projects).where(eq(projects.id, timer.projectId)) : [];
  return { timer, title: project?.title ?? 'Deleted project', notes: project?.description ?? '' };
}

/** The task to show "What's the next step?" for after stopping this timer, or null. */
export async function nextStepPromptAfterStop(db: Db, timer: Timer): Promise<{ id: string; title: string; projectId: string } | null> {
  if (!timer.taskId) return null;
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, timer.taskId), notDeleted(tasks)));
  if (!task?.projectId) return null;
  const [project] = await db.select().from(projects).where(and(eq(projects.id, task.projectId), notDeleted(projects)));
  const steps = project ? await listOpenNextSteps(db, project.id) : [];
  const ask = promptAfterStop({
    task: { status: task.status, completedAt: task.completedAt, projectId: task.projectId },
    projectActive: project?.status === 'active',
    openNextSteps: steps.length,
    startedAt: timer.startedAt,
  });
  return ask ? { id: task.id, title: task.title, projectId: task.projectId } : null;
}
