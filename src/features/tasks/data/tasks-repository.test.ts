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
  moveTask,
  reopenTask,
  resetTaskOrder,
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

describe('manual task order', () => {
  const at = (minute: number) => () => new Date(Date.UTC(2026, 9, 13, 9, minute));
  async function setup(db: Db, names = ['A', 'B', 'C']) {
    const projectId = await addProject(db);
    const ids: Record<string, string> = {};
    for (const [i, name] of names.entries()) ids[name] = await createTask(db, at(i), { ...base, title: name, projectId });
    return { projectId, ids };
  }
  const titles = async (db: Db, projectId: string) => (await listOpenTasksOfProject(db, projectId)).map((t) => t.title);

  it('keeps the due-date order until the list is reordered', async () => {
    const { db } = await openTestDatabase();
    const projectId = await addProject(db);
    await createTask(db, at(0), { ...base, title: 'A', projectId });
    await createTask(db, at(1), { ...base, title: 'B', projectId, dueDate: '2026-10-20' });
    await createTask(db, at(2), { ...base, title: 'C', projectId, dueDate: '2026-10-10' });
    expect(await titles(db, projectId)).toEqual(['C', 'B', 'A']);
  });

  it('moves a task up and keeps the order', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await moveTask(db, clock, ids.C!, 0);
    expect(await titles(db, projectId)).toEqual(['C', 'A', 'B']);
    await moveTask(db, clock, ids.A!, 2);
    expect(await titles(db, projectId)).toEqual(['C', 'B', 'A']);
  });

  it('writes only the moved task after the first move', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db, ['A', 'B', 'C', 'D']);
    await moveTask(db, clock, ids.D!, 0);
    const before = new Map((await listOpenTasksOfProject(db, projectId)).map((t) => [t.id, t.sortOrder]));
    await moveTask(db, at(30), ids.C!, 1);
    const changed = (await listOpenTasksOfProject(db, projectId)).filter((t) => t.sortOrder !== before.get(t.id));
    expect(changed.map((t) => t.title)).toEqual(['C']);
  });

  it('keeps next steps on top of the others', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await setNextStep(db, clock, ids.A!, true);
    await moveTask(db, clock, ids.C!, 0);
    expect(await titles(db, projectId)).toEqual(['A', 'C', 'B']);
  });

  it('puts a task marked as next step at the end of the next steps', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await setNextStep(db, clock, ids.A!, true);
    await moveTask(db, clock, ids.C!, 0);
    await setNextStep(db, clock, ids.C!, true);
    expect(await titles(db, projectId)).toEqual(['A', 'C', 'B']);
    await setNextStep(db, clock, ids.A!, false);
    expect(await titles(db, projectId)).toEqual(['C', 'B', 'A']);
  });

  it('lists a new task after the ordered ones', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await moveTask(db, clock, ids.C!, 0);
    await createTask(db, at(40), { ...base, title: 'D', projectId, dueDate: '2026-10-01' });
    expect(await titles(db, projectId)).toEqual(['C', 'A', 'B', 'D']);
  });

  it('resets to due-date order', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await moveTask(db, clock, ids.C!, 0);
    await resetTaskOrder(db, clock, projectId);
    expect(await titles(db, projectId)).toEqual(['A', 'B', 'C']);
    expect((await listOpenTasksOfProject(db, projectId)).every((t) => t.sortOrder === null)).toBe(true);
  });

  it('drops the position when the task moves to another project', async () => {
    const { db } = await openTestDatabase();
    const { ids, projectId } = await setup(db);
    const other = await addProject(db, 'Trip');
    await createTask(db, at(50), { ...base, title: 'X', projectId: other });
    await moveTask(db, clock, ids.C!, 0);
    await updateTask(db, clock, ids.C!, { ...base, title: 'C', projectId: other });
    const [moved] = (await listOpenTasksOfProject(db, other)).filter((t) => t.title === 'C');
    expect(moved?.sortOrder).toBeNull();
    expect(await titles(db, projectId)).toEqual(['A', 'B']);
  });

  it('renumbers when positions get too close', async () => {
    const { db } = await openTestDatabase();
    const { projectId, ids } = await setup(db);
    await moveTask(db, clock, ids.C!, 0);
    for (let i = 0; i < 60; i += 1) {
      await moveTask(db, clock, ids.B!, 1);
      await moveTask(db, clock, ids.A!, 1);
    }
    const order = await titles(db, projectId);
    expect(order).toHaveLength(3);
    expect(order[0]).toBe('C');
  });
});
