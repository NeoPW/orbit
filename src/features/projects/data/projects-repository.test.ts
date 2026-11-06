import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, habits, tasks } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import {
  createProject,
  deleteProject,
  getProject,
  listProjectsByGoal,
  listProjectsByStatus,
  setProjectStatus,
  updateProject,
  type ProjectInput,
} from './projects-repository.ts';

const clock = () => new Date('2026-10-13T09:00:00Z');
const input: ProjectInput = {
  title: 'Garden',
  description: '',
  areaId: null,
  goalId: null,
  importance: 3,
  deadline: null,
  status: 'active',
};

async function addGoal(db: Awaited<ReturnType<typeof openTestDatabase>>['db'], title: string, status: 'active' | 'completed' = 'active') {
  const fields = createFields(clock);
  await db.insert(goals).values({ ...fields, title, endDate: '2026-12-31', status });
  return fields.id;
}

describe('projects repository', () => {
  it('gives projects created in a row different colours and takes a freed one next', async () => {
    const { db } = await openTestDatabase();
    const ids: string[] = [];
    for (let i = 0; i < 8; i++) ids.push(await createProject(db, clock, input));
    const colors = await Promise.all(ids.map(async (id) => (await getProject(db, id))?.project.color));
    expect(new Set(colors).size).toBe(8);
    expect((await getProject(db, ids[0]!))?.color).toBe('var(--pc0)');
    await deleteProject(db, clock, ids[4]!);
    const next = await createProject(db, clock, input);
    expect((await getProject(db, next))?.project.color).toBe(colors[4]);
  });

  it('saves a chosen colour and keeps it when none is given', async () => {
    const { db } = await openTestDatabase();
    const id = await createProject(db, clock, input);
    await updateProject(db, clock, id, { ...input, color: 'pc6' });
    expect((await getProject(db, id))?.color).toBe('var(--pc6)');
    await updateProject(db, clock, id, { ...input, title: 'Renamed' });
    expect((await getProject(db, id))?.project).toMatchObject({
      title: 'Renamed',
      color: 'pc6',
    });
  });

  it('sets completed_at when completing and clears it when reopening', async () => {
    const { db } = await openTestDatabase();
    const id = await createProject(db, clock, input);
    await setProjectStatus(db, clock, id, 'completed');
    expect((await getProject(db, id))?.project).toMatchObject({
      status: 'completed',
      completedAt: '2026-10-13T09:00:00.000Z',
    });
    await setProjectStatus(db, clock, id, 'active');
    expect((await getProject(db, id))?.project).toMatchObject({
      status: 'active',
      completedAt: null,
    });
  });

  it('deletes the project with its tasks and unlinks its habits', async () => {
    const { db } = await openTestDatabase();
    const id = await createProject(db, clock, input);
    await db.insert(tasks).values({ ...createFields(clock), title: 'Plant', projectId: id });
    await db.insert(habits).values({ ...createFields(clock), title: 'Water', projectId: id });
    await deleteProject(db, clock, id);
    expect(await getProject(db, id)).toBeUndefined();
    const [task] = await db.select().from(tasks);
    expect(task?.deletedAt).not.toBeNull();
    const [habit] = await db.select().from(habits);
    expect(habit).toMatchObject({ projectId: null, deletedAt: null });
  });

  it('moves a project to another goal', async () => {
    const { db } = await openTestDatabase();
    const a = await addGoal(db, 'A');
    const b = await addGoal(db, 'B');
    const id = await createProject(db, clock, { ...input, goalId: a });
    await updateProject(db, clock, id, { ...input, goalId: b });
    expect(await listProjectsByGoal(db, a)).toHaveLength(0);
    const [moved] = await listProjectsByGoal(db, b);
    expect(moved?.project.id).toBe(id);
    expect(moved?.deadline).toEqual({ date: '2026-12-31', inherited: true });
  });

  it('keeps a goal that is no longer active when saving', async () => {
    const { db } = await openTestDatabase();
    const g = await addGoal(db, 'Old', 'completed');
    const id = await createProject(db, clock, { ...input, goalId: g });
    await updateProject(db, clock, id, {
      ...input,
      goalId: g,
      title: 'Garden 2',
    });
    const got = await getProject(db, id);
    expect(got?.project).toMatchObject({ goalId: g, title: 'Garden 2' });
    expect(got?.goalStatus).toBe('completed');
    expect((await listProjectsByStatus(db, 'active')).map((p) => p.project.id)).toEqual([id]);
  });
});
