import { and, eq, isNull } from 'drizzle-orm';
import { addDays } from '../../../core/dates/today.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import type { Clock } from '../../../core/db/records.ts';
import { projects } from '../../../core/db/schema.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { addMeasure, type MeasureFields } from '../../goals/data/measures-repository.ts';
import { createGoal, setGoalStatus } from '../../goals/data/goals-repository.ts';
import { checkHabit, createHabit, type HabitInput } from '../../habits/data/habits-repository.ts';
import { saveNote } from '../../notes/data/notes-repository.ts';
import { createProject, setProjectStatus, type ProjectInput } from '../../projects/data/projects-repository.ts';
import { currentWeekStart } from '../../review/domain/review-week.ts';
import { createTask, setNextStep, type TaskInput } from '../../tasks/data/tasks-repository.ts';
import { insertLogEntryQuery } from '../../work-log/data/log-repository.ts';

// Example data for trying the app (a dev tool, see ExampleDataSection): the same
// goals, projects, tasks and habits as the design mock-ups, with dates relative to
// today so that the deadline badges (overdue, soon, later) show up.

const MARKER = 'Chapter 4: Evaluation';

/** True when the example data is already in the database. */
export async function hasExampleData(db: Db): Promise<boolean> {
  const [row] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.title, MARKER), isNull(projects.deletedAt)));
  return row !== undefined;
}

const numeric = (title: string, start: number, target: number, current: number, unit: string, step = 1): MeasureFields => ({
  title, description: '', measureType: 'numeric', startValue: start, targetValue: target, currentValue: current, unit, step, habitId: null,
});

const project = (title: string, o: Partial<ProjectInput> & Pick<ProjectInput, 'importance' | 'color'>): ProjectInput => ({
  description: '', areaId: null, goalId: null, deadline: null, status: 'active', ...o, title,
});

const task = (title: string, o: Partial<TaskInput> = {}): TaskInput => ({
  notes: '', dueDate: null, importance: null, projectId: null, goalId: null, ...o, title,
});

const habit = (title: string, o: Partial<HabitInput>): HabitInput => ({
  projectId: null, goalId: null, scheduleType: 'daily', weekdays: [], timesPerWeek: null, reminderTime: null, active: true, ...o, title,
});

/** Adds the example data (goals with measures, projects, tasks with next steps, habits with check-ins, work log, notes, archive). */
export async function loadExampleData(db: Db, clock: Clock, today: string): Promise<void> {
  const areaId = new Map((await listAreas(db)).map((a) => [a.name, a.id]));
  const area = (name: string) => areaId.get(name) ?? null;

  // Goals
  const frontend = await createGoal(db, clock, { title: 'Land a frontend role', description: '', startDate: addDays(today, -36), endDate: addDays(today, 55), color: 'pc1' });
  const marathon = await createGoal(db, clock, { title: 'Run a half marathon', description: '', startDate: addDays(today, -66), endDate: addDays(today, 5), color: 'pc2' });
  const thesis = await createGoal(db, clock, { title: 'Finish thesis draft', description: '', startDate: addDays(today, -52), endDate: addDays(today, 85), color: 'pc0' });

  // Projects
  const chapter4 = await createProject(db, clock, project(MARKER, { areaId: area('Uni'), goalId: thesis, importance: 4, deadline: addDays(today, -1), color: 'pc0' }));
  const portfolio = await createProject(db, clock, project('Portfolio site', { areaId: area('Job'), goalId: frontend, importance: 4, deadline: addDays(today, 3), color: 'pc1' }));
  const training = await createProject(db, clock, project('Training block 3', { areaId: area('Sport'), goalId: marathon, importance: 3, color: 'pc2' }));
  const orbit = await createProject(db, clock, project('Orbit app rebuild', { areaId: area('Personal'), goalId: frontend, importance: 5, color: 'pc3' }));
  const tax = await createProject(db, clock, project('Tax return 2025', { areaId: area('Personal'), importance: 2, deadline: addDays(today, 24), color: 'pc4' }));
  await createProject(db, clock, project('Learn Rust basics', { areaId: area('Personal'), importance: 2, status: 'backlog', color: 'pc5' }));
  await createProject(db, clock, project('Garden redesign', { areaId: area('Personal'), importance: 3, status: 'paused', color: 'pc6' }));

  // Tasks: [project, title, due offset (days) or null, next step]
  const rows: [string, string, number | null, boolean][] = [
    [chapter4, 'Rerun benchmarks', -1, true],
    [chapter4, 'Email supervisor', -2, true],
    [chapter4, 'Write evaluation summary', 9, false],
    [chapter4, 'Fix figure captions', null, false],
    [portfolio, 'Record case study video', 3, true],
    [portfolio, 'Write about page', 12, false],
    [training, 'Book physio check', 1, true],
    [orbit, 'Ship Android companion spike', null, true],
    [orbit, 'Sketch sync conflict UI', null, false],
    [tax, 'Collect receipts', null, true],
  ];
  for (const [projectId, title, due, next] of rows) {
    const id = await createTask(db, clock, task(title, { projectId, dueDate: due === null ? null : addDays(today, due) }));
    if (next) await setNextStep(db, clock, id, true);
  }
  await createTask(db, clock, task('Update LinkedIn headline', { goalId: frontend, dueDate: addDays(today, 6) }));
  await createTask(db, clock, task('Renew passport', { importance: 3, dueDate: addDays(today, 14) }));

  // Habits
  const idOf = async (input: HabitInput) => {
    const result = await createHabit(db, clock, input);
    if (!result.ok) throw new Error('example habit invalid');
    return result.id;
  };
  const stretch = await idOf(habit('Stretch', { projectId: training }));
  const run = await idOf(habit('Run 5 km', { projectId: training, scheduleType: 'weekdays', weekdays: [2, 4, 6] }));
  await idOf(habit('Read 20 pages', { goalId: thesis, scheduleType: 'weekdays', weekdays: [1, 2, 3, 4, 5] }));
  await idOf(habit('Duolingo', {}));
  const interviews = await idOf(habit('Mock interview prep', { goalId: frontend, scheduleType: 'times_per_week', timesPerWeek: 3 }));
  await idOf(habit('Meditate', { active: false }));
  // A check is logged at the clock's time, so a check of an earlier day gets that day's morning (not a pile of markers on today's timeline).
  const morning = (date: string): Clock => () => (date === today ? clock() : new Date(`${date}T07:00:00`));
  const check = (habitId: string, offset: number) => {
    const date = addDays(today, offset);
    return checkHabit(db, morning(date), habitId, date);
  };
  for (const offset of [0, -1, -2, -4, -5, -6]) await check(stretch, offset);
  for (let i = 1; i <= 22; i++) await check(run, -3 * i + 3);
  for (const offset of [-30, -23, -16, -9]) await check(interviews, offset);

  // Measures
  await addMeasure(db, clock, frontend, numeric('Applications sent', 0, 20, 9, 'applications'));
  await addMeasure(db, clock, frontend, { title: 'Portfolio live', description: '', measureType: 'boolean', startValue: null, targetValue: null, currentValue: 1, unit: null, step: 1, habitId: null });
  await addMeasure(db, clock, frontend, { title: 'Mock interviews', description: '', measureType: 'habit', startValue: null, targetValue: 10, currentValue: null, unit: null, step: 1, habitId: interviews });
  await addMeasure(db, clock, marathon, numeric('Long run', 5, 21, 14, 'km', 1));
  await addMeasure(db, clock, marathon, { title: 'Runs logged', description: '', measureType: 'habit', startValue: null, targetValue: 36, currentValue: null, unit: null, step: 1, habitId: run });
  await addMeasure(db, clock, thesis, numeric('Chapters drafted', 0, 6, 3, 'chapters'));

  // Work this week
  const at = (offset: number, hour: number) => new Date(`${addDays(today, offset)}T${String(hour).padStart(2, '0')}:00:00`).toISOString();
  const log = (projectId: string, offset: number, hour: number, minutes: number | null, note: string, source: 'manual' | 'timer' | 'task' = 'manual', minute = 0) =>
    insertLogEntryQuery(db, clock, {
      projectId,
      goalId: null,
      taskId: null,
      occurredAt: new Date(new Date(at(offset, hour)).getTime() + minute * 60000).toISOString(),
      durationMinutes: minutes,
      note,
      source,
    });
  await log(chapter4, -1, 9, 90, 'Drafted the evaluation chapter');
  await log(chapter4, -2, 14, 45, 'Cleaned the dataset');
  await log(portfolio, -1, 16, 60, 'Case study layout');
  await log(training, -2, 7, 40, 'Long run');
  // Today, for the Today timeline: a timer entry (starts at its time), manual entries (end at their time) and a completed task
  await log(chapter4, 0, 7, 50, 'Reran the benchmarks', 'timer', 30);
  await log(portfolio, 0, 9, 60, 'Case study copy');
  await log(orbit, 0, 9, 45, 'Timeline sketches', 'manual', 30);
  await log(chapter4, 0, 11, null, 'Email supervisor', 'task', 20);
  // Focus sessions (timer entries start at their time), today and earlier this week
  await log(portfolio, 0, 10, 50, 'Focus: case study layout', 'timer', 15);
  await log(orbit, 0, 13, 90, 'Focus: timeline blocks', 'timer');
  await log(chapter4, 0, 15, 25, 'Focus: figure captions', 'timer', 30);
  await log(chapter4, -1, 10, 60, 'Focus: results section', 'timer');
  await log(orbit, -1, 14, 45, 'Focus: habit sessions', 'timer', 30);
  await log(portfolio, -2, 9, 75, 'Focus: responsive grid', 'timer');
  await log(training, -3, 18, 30, 'Focus: mobility routine', 'timer');
  await log(chapter4, -4, 9, 90, 'Focus: literature notes', 'timer', 30);

  // Weekly notes of this week
  const week = currentWeekStart(today);
  await saveNote(db, clock, 'project', chapter4, week, 'Benchmarks were flaky on the CI runner; reran twice.');
  await saveNote(db, clock, 'goal', frontend, week, 'Two applications sent, portfolio is live.');

  // Archive
  const spanish = await createGoal(db, clock, { title: 'Learn Spanish A2', description: '', startDate: addDays(today, -200), endDate: addDays(today, -120), color: 'pc7' });
  await setGoalStatus(db, clock, spanish, 'completed');
  const moving = await createProject(db, clock, project('Move flat', { areaId: area('Personal'), importance: 3, color: 'pc4' }));
  await setProjectStatus(db, clock, moving, 'completed');
}
