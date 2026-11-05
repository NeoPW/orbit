import type { Db } from '../../../core/db/drizzle.ts';
import type { Clock } from '../../../core/db/records.ts';
import { createTask, setNextStep } from '../../tasks/data/tasks-repository.ts';

/** Adds a task to the project and marks it as next step; returns its id, or null for an empty title. */
export async function addNextStep(db: Db, clock: Clock, projectId: string, title: string): Promise<string | null> {
  if (title.trim() === '') return null;
  const id = await createTask(db, clock, { title, notes: '', dueDate: null, importance: null, projectId, goalId: null });
  await setNextStep(db, clock, id, true);
  return id;
}
