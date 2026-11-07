import { describe, expect, it } from 'vitest';
import { planReminders, type ReminderHabit, type ReminderInput, type ReminderSettings } from './plan-reminders.ts';

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const settings: ReminderSettings = { remindersOn: true, reminderTime: '08:00', leadDays: 7, reviewDay: 7, reviewTime: '18:00' };
const empty: ReminderInput = { habits: [], checks: [], tasks: [], projects: [], completedReviewWeeks: [], focus: null };
const notReview = (list: ReturnType<typeof planReminders>) => list.filter((r) => r.route !== '/review/flow');
const habit = (extra: Partial<ReminderHabit> = {}): ReminderHabit => ({
  id: 'h1',
  title: 'Stretch',
  active: true,
  scheduleType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  reminderTime: null,
  linkTitle: null,
  ...extra,
});
/** Wednesday 2026-10-14. */
const day = (
  input: Partial<ReminderInput>,
  s: Partial<ReminderSettings> = {},
  now = local(2026, 10, 14, 0, 0),
  until = local(2026, 10, 14, 23, 59),
) => planReminders({ ...empty, ...input }, { ...settings, ...s }, now, until);

describe('habit reminders', () => {
  it('uses the own reminder time and shows the title and link', () => {
    const [r] = day({ habits: [habit({ reminderTime: '07:30', linkTitle: 'Get fit' })] });
    expect(r).toMatchObject({ title: 'Stretch', body: 'Get fit', route: '/home', key: 'habit:h1:2026-10-14' });
    expect(r?.at).toEqual(local(2026, 10, 14, 7, 30));
  });

  it('uses the default reminder time', () => {
    expect(day({ habits: [habit()] })[0]?.at).toEqual(local(2026, 10, 14, 8, 0));
  });

  it('skips a day on which the habit is not due', () => {
    expect(
      day({ habits: [habit({ scheduleType: 'weekdays', weekdays: [1, 3, 5] })] }, {}, local(2026, 10, 13), local(2026, 10, 13, 23, 59)),
    ).toEqual([]);
  });

  it('skips inactive habits', () => {
    expect(day({ habits: [habit({ active: false })] })).toEqual([]);
  });

  it('skips a habit that is checked on the day', () => {
    expect(day({ habits: [habit()], checks: [{ habitId: 'h1', date: '2026-10-14' }] })).toEqual([]);
  });

  it('skips a habit whose weekly target is reached', () => {
    const h = habit({ scheduleType: 'times_per_week', timesPerWeek: 2 });
    const checks = [
      { habitId: 'h1', date: '2026-10-12' },
      { habitId: 'h1', date: '2026-10-13' },
    ];
    expect(day({ habits: [h], checks }, {}, local(2026, 10, 14), local(2026, 10, 16, 23, 59))).toEqual([]);
  });

  it('leaves out reminders before now', () => {
    expect(day({ habits: [habit()] }, {}, local(2026, 10, 14, 9, 0))).toEqual([]);
  });

  it('plans every day up to until', () => {
    expect(day({ habits: [habit()] }, {}, local(2026, 10, 14), local(2026, 10, 16, 23, 59)).map((r) => r.key)).toEqual([
      'habit:h1:2026-10-14',
      'habit:h1:2026-10-15',
      'habit:h1:2026-10-16',
    ]);
  });
});

describe('deadline reminders', () => {
  const task = { id: 't1', title: 'Book venue', dueDate: '2026-10-20' };
  const range = [local(2026, 10, 13), local(2026, 10, 21)] as const;

  it('reminds when the deadline enters the lead time and on the date', () => {
    const list = notReview(planReminders({ ...empty, tasks: [task] }, settings, ...range));
    expect(list.map((r) => [r.at, r.body, r.route])).toEqual([
      [local(2026, 10, 13, 8), 'Due in 7 days', '/tasks/t1'],
      [local(2026, 10, 20, 8), 'Due today', '/tasks/t1'],
    ]);
  });

  it('only reminds on the date when the lead date has passed', () => {
    const list = notReview(planReminders({ ...empty, tasks: [task] }, settings, local(2026, 10, 15), range[1]));
    expect(list.map((r) => r.body)).toEqual(['Due today']);
  });

  it('reminds for an active project with its own deadline', () => {
    const list = notReview(
      planReminders({ ...empty, projects: [{ id: 'p1', title: 'Garden', deadline: '2026-10-20' }] }, settings, ...range),
    );
    expect(list.map((r) => r.route)).toEqual(['/projects/p1', '/projects/p1']);
  });

  it('follows a moved deadline through new keys', () => {
    const keys = (due: string) =>
      notReview(planReminders({ ...empty, tasks: [{ ...task, dueDate: due }] }, settings, local(2026, 10, 1), local(2026, 11, 1))).map(
        (r) => r.key,
      );
    expect(keys('2026-10-20').filter((k) => keys('2026-10-25').includes(k))).toEqual([]);
  });
});

describe('weekly review reminder', () => {
  const sunday = [local(2026, 10, 11, 0), local(2026, 10, 11, 23, 59)] as const;

  it('comes on the review day at the review time and names the week', () => {
    const [r] = planReminders(empty, settings, ...sunday);
    expect(r).toMatchObject({ title: 'Weekly review', body: 'Week 05-10-2026 – 11-10-2026', route: '/review/flow' });
    expect(r?.at).toEqual(local(2026, 10, 11, 18));
  });

  it('does not come when the week is already reviewed', () => {
    expect(planReminders({ ...empty, completedReviewWeeks: ['2026-10-05'] }, settings, ...sunday)).toEqual([]);
  });

  it('follows a changed review day', () => {
    const list = planReminders(empty, { ...settings, reviewDay: 1 }, local(2026, 10, 9), local(2026, 10, 13));
    expect(list.map((r) => r.key)).toEqual(['review:2026-10-12']);
  });
});

describe('reminders off and focus end', () => {
  const everything: Partial<ReminderInput> = {
    habits: [habit()],
    tasks: [{ id: 't1', title: 'x', dueDate: '2026-10-14' }],
    focus: { title: 'Thesis', startedAt: local(2026, 10, 14, 10, 0).toISOString(), workedSeconds: 0, limitMinutes: 25 },
  };

  it('keeps only the focus end when reminders are off', () => {
    const list = day(everything, { remindersOn: false });
    expect(list.map((r) => r.route)).toEqual(['/focus']);
  });

  it('notifies the end of a planned focus session', () => {
    const [r] = day({ focus: everything.focus ?? null }, { remindersOn: false });
    expect(r).toMatchObject({ title: 'Thesis: 25 minutes done', route: '/focus' });
    expect(r?.at).toEqual(local(2026, 10, 14, 10, 25));
  });

  it('counts the minutes worked before the current stretch toward the limit', () => {
    const focus = { title: 'Thesis', startedAt: local(2026, 10, 14, 11, 0).toISOString(), workedSeconds: 1200, limitMinutes: 30 };
    const [r] = day({ focus }, { remindersOn: false });
    expect(r?.at).toEqual(local(2026, 10, 14, 11, 10));
  });

  it('plans nothing when no session has a limit or the limit is already reached', () => {
    expect(day({ focus: null }, { remindersOn: false })).toEqual([]);
    const reached = { title: 'Thesis', startedAt: local(2026, 10, 14, 11, 0).toISOString(), workedSeconds: 1200, limitMinutes: 15 };
    expect(day({ focus: reached }, { remindersOn: false })).toEqual([]);
  });

  it('returns the reminders in time order', () => {
    expect(day(everything).map((r) => r.route)).toEqual(['/tasks/t1', '/home', '/focus']);
  });
});
