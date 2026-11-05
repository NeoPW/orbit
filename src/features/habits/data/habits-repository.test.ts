import { describe, expect, it } from 'vitest';
import { createFields } from '../../../core/db/records.ts';
import { habitChecks, logEntries, measures } from '../../../core/db/schema.ts';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { checkHabit, createHabit, deleteHabit, listChecksSince, listHabits, uncheckHabit, type HabitInput } from './habits-repository.ts';

const clock = () => new Date('2026-11-05T10:00:00Z');
const input: HabitInput = {
  title: 'Run',
  projectId: 'p1',
  goalId: null,
  scheduleType: 'daily',
  weekdays: [],
  timesPerWeek: null,
  reminderTime: null,
  active: true,
};

async function setup(over: Partial<HabitInput> = {}) {
  const { db } = await openTestDatabase();
  const result = await createHabit(db, clock, { ...input, ...over });
  if (!result.ok) throw new Error('invalid');
  return { db, id: result.id };
}

const live = async (db: Awaited<ReturnType<typeof setup>>['db']) => ({
  checks: (await db.select().from(habitChecks)).filter((c) => c.deletedAt === null),
  entries: (await db.select().from(logEntries)).filter((e) => e.deletedAt === null),
});

describe('habits repository', () => {
  it('rejects an invalid schedule and stores only the chosen schedule fields', async () => {
    const { db } = await openTestDatabase();
    expect(await createHabit(db, clock, { ...input, scheduleType: 'weekdays', weekdays: [] })).toMatchObject({ ok: false });
    await createHabit(db, clock, { ...input, scheduleType: 'weekdays', weekdays: [5, 1], timesPerWeek: 3 });
    expect((await listHabits(db))[0]).toMatchObject({ weekdays: [1, 5], timesPerWeek: null });
  });

  it('checks a habit with a check and a habit log entry for its project', async () => {
    const { db, id } = await setup();
    await checkHabit(db, clock, id, '2026-11-05');
    const { checks, entries } = await live(db);
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({ habitId: id, date: '2026-11-05', logEntryId: entries[0]?.id });
    expect(entries[0]).toMatchObject({ source: 'habit', projectId: 'p1', note: 'Run', durationMinutes: null });
  });

  it("checks a goal's habit with the goal on the entry", async () => {
    const { db, id } = await setup({ projectId: null, goalId: 'g1' });
    await checkHabit(db, clock, id, '2026-11-05');
    expect((await live(db)).entries[0]).toMatchObject({ goalId: 'g1', projectId: null });
  });

  it('does not duplicate a check', async () => {
    const { db, id } = await setup();
    await checkHabit(db, clock, id, '2026-11-05');
    await checkHabit(db, clock, id, '2026-11-05');
    const { checks, entries } = await live(db);
    expect(checks).toHaveLength(1);
    expect(entries).toHaveLength(1);
  });

  it('unchecks and can check again', async () => {
    const { db, id } = await setup();
    await checkHabit(db, clock, id, '2026-11-05');
    await uncheckHabit(db, clock, id, '2026-11-05');
    expect(await live(db)).toEqual({ checks: [], entries: [] });
    await checkHabit(db, clock, id, '2026-11-05');
    const { checks, entries } = await live(db);
    expect(checks).toHaveLength(1);
    expect(entries).toHaveLength(1);
    expect(checks[0]?.logEntryId).toBe(entries[0]?.id);
    expect(await listChecksSince(db, '2026-11-01')).toHaveLength(1);
    expect(await listChecksSince(db, '2026-11-06')).toHaveLength(0);
  });

  it('keeps a measure without a habit when the habit is deleted', async () => {
    const { db, id } = await setup();
    const m = { ...createFields(clock), goalId: 'g1', title: 'Runs', measureType: 'habit' as const, habitId: id };
    await db.insert(measures).values(m);
    await deleteHabit(db, clock, id);
    expect(await listHabits(db)).toHaveLength(0);
    const [measure] = await db.select().from(measures);
    expect(measure).toMatchObject({ habitId: null, deletedAt: null });
  });
});
