import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { goals, projects } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { checkHabit, createHabit } from '../../habits/data/habits-repository.ts';
import { completeTask, createTask, setNextStep, type TaskInput } from '../../tasks/data/tasks-repository.ts';
import { listActiveHabitOptions, listActiveProjects, listDoneToday, listHabitsForToday, listMoreTodo, listTodo } from './home-queries.ts';

const clock = () => new Date('2026-10-05T09:00:00Z');
const TODAY = '2026-10-05';
const base: TaskInput = { title: 'Task', notes: '', dueDate: null, importance: null, projectId: null, goalId: null };

type Db = Awaited<ReturnType<typeof openTestDatabase>>['db'];

async function addProject(db: Db, title: string, extra: Partial<typeof projects.$inferInsert> = {}) {
  const fields = createFields(clock);
  await db.insert(projects).values({ ...fields, title, ...extra });
  return fields.id;
}
async function addGoal(db: Db, title: string, extra: Partial<typeof goals.$inferInsert> = {}) {
  const fields = createFields(clock);
  await db.insert(goals).values({ ...fields, title, ...extra });
  return fields.id;
}
async function step(db: Db, projectId: string, title: string) {
  const id = await createTask(db, clock, { ...base, title, projectId });
  await setNextStep(db, clock, id, true);
  return id;
}

describe('home queries', () => {
  it('lists next steps and loose tasks, ranked, but not other project tasks', async () => {
    const { db } = await openTestDatabase();
    const wedding = await addProject(db, 'Wedding');
    await step(db, wedding, 'Draft outline');
    await createTask(db, clock, { ...base, title: 'Send invites', projectId: wedding });
    await createTask(db, clock, { ...base, title: 'Tax return', dueDate: '2026-10-01' });
    const todo = await listTodo(db, TODAY);
    expect(todo.map((t) => t.task.title)).toEqual(['Tax return', 'Draft outline']);
    expect(todo[1]).toMatchObject({ context: 'Wedding', importance: { value: 3, inherited: true } });
  });

  it('leaves out next steps of a paused project', async () => {
    const { db } = await openTestDatabase();
    const paused = await addProject(db, 'Garden', { status: 'paused' });
    await step(db, paused, 'Buy seeds');
    expect(await listTodo(db, TODAY)).toEqual([]);
  });

  it('lists a task of a goal with the goal title and ranks it by the goal end', async () => {
    const { db } = await openTestDatabase();
    const goal = await addGoal(db, 'Get fit', { endDate: '2026-10-25' });
    await createTask(db, clock, { ...base, title: 'Book physio', goalId: goal });
    await createTask(db, clock, { ...base, title: 'Other' });
    const todo = await listTodo(db, TODAY);
    expect(todo.map((t) => [t.task.title, t.context])).toEqual([
      ['Book physio', 'Get fit'],
      ['Other', null],
    ]);
  });

  it('lists active projects by score with their open tasks, next steps first', async () => {
    const { db } = await openTestDatabase();
    const a = await addProject(db, 'A', { importance: 5 });
    const b = await addProject(db, 'B', { importance: 2, deadline: '2026-10-01' });
    await addProject(db, 'Paused', { status: 'paused' });
    await createTask(db, clock, { ...base, title: 'Book venue', projectId: b });
    await createTask(db, clock, { ...base, title: 'Send invites', projectId: b });
    await step(db, b, 'Draft outline');
    const list = await listActiveProjects(db, TODAY);
    expect(list.map((p) => [p.view.project.id, p.tasks.map((t) => t.title), p.openCount])).toEqual([
      [b, ['Draft outline', 'Book venue', 'Send invites'], 3],
      [a, [], 0],
    ]);
  });

  it('shows at most three tasks on a project card and counts the rest', async () => {
    const { db } = await openTestDatabase();
    const p = await addProject(db, 'P');
    for (const title of ['T1', 'T2', 'T3', 'T4', 'T5']) await createTask(db, clock, { ...base, title, projectId: p });
    const [card] = await listActiveProjects(db, TODAY);
    expect(card?.tasks.map((t) => t.title)).toEqual(['T1', 'T2', 'T3']);
    expect(card?.openCount).toBe(5);
  });

  it('lists the other open tasks of active projects for "Show more", not next steps or paused projects', async () => {
    const { db } = await openTestDatabase();
    const wedding = await addProject(db, 'Wedding');
    const garden = await addProject(db, 'Garden', { status: 'paused' });
    await step(db, wedding, 'Draft outline');
    await createTask(db, clock, { ...base, title: 'Send invites', projectId: wedding });
    await createTask(db, clock, { ...base, title: 'Weed beds', projectId: garden });
    await createTask(db, clock, { ...base, title: 'Tax return' });
    const more = await listMoreTodo(db, TODAY);
    expect(more.map((t) => [t.task.title, t.context])).toEqual([['Send invites', 'Wedding']]);
  });

  it('keeps a habit listed after it is checked and leaves out one that is not due', async () => {
    const { db } = await openTestDatabase();
    const project = await addProject(db, 'Marathon');
    const goal = await addGoal(db, 'Learn Spanish');
    const habit = {
      title: 'Stretch',
      projectId: project,
      goalId: null,
      scheduleType: 'times_per_week' as const,
      weekdays: [],
      timesPerWeek: 1,
      reminderTime: null,
      active: true,
    };
    const stretch = await createHabit(db, clock, habit);
    await createHabit(db, clock, { ...habit, title: 'Read', projectId: null, goalId: goal, scheduleType: 'daily', timesPerWeek: null });
    await createHabit(db, clock, { ...habit, title: 'Off', active: false });
    if (!stretch.ok) throw new Error('invalid');
    expect((await listHabitsForToday(db, TODAY)).map((h) => [h.title, h.label, h.checked])).toEqual([
      ['Stretch', 'Marathon', false],
      ['Read', 'Learn Spanish', false],
    ]);
    await checkHabit(db, clock, stretch.id, TODAY);
    expect((await listHabitsForToday(db, TODAY)).map((h) => [h.title, h.checked])).toEqual([
      ['Stretch', true],
      ['Read', false],
    ]);
  });

  it("lists the tasks completed today, newest first, and not yesterday's", async () => {
    const { db } = await openTestDatabase();
    const input: TaskInput = { title: 'A', notes: '', dueDate: null, importance: null, projectId: null, goalId: null };
    const a = await createTask(db, clock, { ...input, title: 'Early' });
    const b = await createTask(db, clock, { ...input, title: 'Late' });
    const c = await createTask(db, clock, { ...input, title: 'Yesterday' });
    const open = await createTask(db, clock, { ...input, title: 'Still open' });
    await completeTask(db, () => new Date(2026, 9, 5, 9, 0), a, { kind: 'skip' });
    await completeTask(db, () => new Date(2026, 9, 5, 15, 30), b, { kind: 'skip' });
    await completeTask(db, () => new Date(2026, 9, 4, 22, 0), c, { kind: 'skip' });
    const done = await listDoneToday(db, '2026-10-05');
    expect(done.map((d) => d.task.title)).toEqual(['Late', 'Early']);
    expect(done.some((d) => d.task.id === open)).toBe(false);
  });

  it('lists all active habits with their project, not only the due ones', async () => {
    const { db } = await openTestDatabase();
    const project = createFields(clock);
    await db.insert(projects).values({ ...project, title: 'Training', color: 'pc2' });
    const base = {
      projectId: project.id,
      goalId: null,
      scheduleType: 'weekdays' as const,
      weekdays: [1],
      timesPerWeek: null,
      reminderTime: null,
    };
    await createHabit(db, clock, { ...base, title: 'Run', active: true });
    await createHabit(db, clock, { ...base, title: 'Paused', active: false });
    const options = await listActiveHabitOptions(db);
    expect(options).toMatchObject([{ title: 'Run', projectTitle: 'Training', projectColor: 'var(--pc2)' }]);
  });
});
