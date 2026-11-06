import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, logEntries, projects } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listOpenNextSteps,
  listOpenTasks,
  listOpenTasksOfProject,
  reopenTask,
  setNextStep,
  undoCompleteTask,
  updateTask,
  type TaskInput,
} from './tasks-repository.ts';
import { deleteGoal } from '../../goals/data/goals-repository.ts';

const clock = () => new Date('2026-10-13T09:00:00Z');
const base: TaskInput = { title: 'Book venue', notes: '', dueDate: null, importance: null, projectId: null, goalId: null };

type Db = Awaited<ReturnType<typeof openTestDatabase>>['db'];

async function addProject(db: Db, title = 'Wedding') {
  const fields = createFields(clock);
  await db.insert(projects).values({ ...fields, title });
  return fields.id;
}
async function addGoal(db: Db, title = 'Get fit') {
  const fields = createFields(clock);
  await db.insert(goals).values({ ...fields, title });
  return fields.id;
}
/** A next-step task in a project. */
async function nextStep(db: Db, projectId: string, title: string) {
  const id = await createTask(db, clock, { ...base, title, projectId });
  await setNextStep(db, clock, id, true);
  return id;
}
const logs = (db: Db) => db.select().from(logEntries);

describe('tasks repository', () => {
  it('adds an open task with a trimmed title and due date', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const id = await createTask(db, clock, { ...base, title: '  Book venue ', dueDate: '2026-10-20', projectId: p });
    expect((await listOpenTasksOfProject(db, p)).map((t) => [t.title, t.dueDate, t.status])).toEqual([['Book venue', '2026-10-20', 'open']]);
    expect((await getTask(db, id))?.projectTitle).toBe('Wedding');
  });

  it('completes a task with a log entry for its project', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const id = await createTask(db, clock, { ...base, projectId: p });
    await completeTask(db, clock, id, { kind: 'direct' });
    expect((await getTask(db, id))?.task).toMatchObject({ status: 'done', completedAt: '2026-10-13T09:00:00.000Z' });
    expect(await logs(db)).toMatchObject([{ source: 'task', taskId: id, projectId: p, goalId: null, note: 'Book venue', durationMinutes: null }]);
  });

  it('completes a standalone task and a goal task with the right links', async () => {
    const { db } = await openTestDatabase();
    const g = await addGoal(db);
    const alone = await createTask(db, clock, { ...base, title: 'Tax return' });
    const goalTask = await createTask(db, clock, { ...base, title: 'Book physio', goalId: g });
    await completeTask(db, clock, alone, { kind: 'direct' });
    await completeTask(db, clock, goalTask, { kind: 'direct' });
    const rows = await logs(db);
    expect(rows.find((r) => r.taskId === alone)).toMatchObject({ projectId: null, goalId: null });
    expect(rows.find((r) => r.taskId === goalTask)).toMatchObject({ projectId: null, goalId: g });
  });

  it('undo reopens, deletes the entry and restores the next-step flag, keeping chosen next steps', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    const b = await createTask(db, clock, { ...base, title: 'Book venue', projectId: p });
    const done = await completeTask(db, clock, a, { kind: 'pick', taskIds: [b] });
    expect(done).toMatchObject({ taskId: a, wasNextStep: true });
    await undoCompleteTask(db, clock, done!);
    expect((await getTask(db, a))?.task).toMatchObject({ status: 'open', completedAt: null, isNextStep: true });
    expect((await getTask(db, b))?.task.isNextStep).toBe(true);
    expect((await logs(db)).filter((l) => !l.deletedAt)).toHaveLength(0);
  });

  it('deleting the only next step leaves the project without one', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    await deleteTask(db, clock, a);
    expect(await listOpenNextSteps(db, p)).toEqual([]);
  });

  it('reopens a done task and keeps its log entry', async () => {
    const { db } = await openTestDatabase();
    const id = await createTask(db, clock, base);
    await completeTask(db, clock, id, { kind: 'direct' });
    await reopenTask(db, clock, id);
    expect((await getTask(db, id))?.task).toMatchObject({ status: 'open', completedAt: null });
    expect((await logs(db)).filter((l) => !l.deletedAt)).toHaveLength(1);
  });

  it('allows several next steps and unmarking one', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    await nextStep(db, p, 'Book venue');
    expect(await listOpenNextSteps(db, p)).toHaveLength(2);
    await setNextStep(db, clock, a, false);
    expect((await listOpenNextSteps(db, p)).map((t) => t.title)).toEqual(['Book venue']);
    expect((await listOpenTasksOfProject(db, p)).map((t) => t.title)).toContain('Draft outline');
  });

  it('creates and marks a new next step', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    const done = await completeTask(db, clock, a, { kind: 'new', title: ' Write intro ' });
    const created = await getTask(db, done!.createdTaskId!);
    expect(created?.task).toMatchObject({ title: 'Write intro', status: 'open', isNextStep: true, projectId: p });
    expect((await getTask(db, a))?.task.status).toBe('done');
  });

  it('marks several picked tasks as next steps', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    const b = await createTask(db, clock, { ...base, title: 'Book venue', projectId: p });
    const c = await createTask(db, clock, { ...base, title: 'Send invites', projectId: p });
    await completeTask(db, clock, a, { kind: 'pick', taskIds: [b, c] });
    expect((await listOpenNextSteps(db, p)).map((t) => t.id).sort()).toEqual([b, c].sort());
  });

  it('skip completes without a next step', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const a = await nextStep(db, p, 'Draft outline');
    await completeTask(db, clock, a, { kind: 'skip' });
    expect(await listOpenNextSteps(db, p)).toEqual([]);
    expect((await getTask(db, a))?.task.status).toBe('done');
  });

  it('assigning a next step to a goal removes the project and the next-step flag', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db);
    const g = await addGoal(db);
    const a = await nextStep(db, p, 'Draft outline');
    await updateTask(db, clock, a, { ...base, title: 'Draft outline', goalId: g });
    expect((await getTask(db, a))?.task).toMatchObject({ projectId: null, goalId: g, isNextStep: false });
  });

  it('keeps a task standalone after its goal is deleted', async () => {
    const { db } = await openTestDatabase();
    const g = await addGoal(db);
    const id = await createTask(db, clock, { ...base, goalId: g });
    await deleteGoal(db, clock, g);
    expect((await getTask(db, id))?.task).toMatchObject({ goalId: null, projectId: null, status: 'open' });
  });

  it('lists all open tasks (not only next steps) with their project, without done or deleted ones', async () => {
    const { db } = await openTestDatabase();
    const projectId = await addProject(db);
    const a = await createTask(db, clock, { ...base, title: 'Plain' });
    const b = await createTask(db, clock, { ...base, title: 'In project', projectId });
    const done = await createTask(db, clock, { ...base, title: 'Done one' });
    const gone = await createTask(db, clock, { ...base, title: 'Gone' });
    await completeTask(db, clock, done, { kind: 'skip' });
    await deleteTask(db, clock, gone);
    const list = await listOpenTasks(db);
    expect(list.map((v) => v.task.id).sort()).toEqual([a, b].sort());
    expect(list.find((v) => v.task.id === b)?.projectTitle).toBe('Wedding');
  });
});
