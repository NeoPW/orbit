import { describe, expect, it } from 'vitest';
import { clockJumped, delayUntil, planFrom, splitDue } from './next-reminder.ts';
import type { PlannedReminder } from './plan-reminders.ts';

const at = (hhmm: string) => new Date(`2026-11-05T${hhmm}:00`);
const reminder = (key: string, time: string): PlannedReminder => ({ key, at: at(time), title: key, body: '', route: '/' });

describe('splitDue', () => {
  const planned = [reminder('a', '09:00'), reminder('b', '10:00'), reminder('c', '11:00')];

  it('separates due, shown and upcoming reminders', () => {
    const { due, next } = splitDue(planned, at('10:00'), new Set(['a']));
    expect(due.map((r) => r.key)).toEqual(['b']);
    expect(next?.key).toBe('c');
  });

  it('never returns a shown key again', () => {
    const { due, next } = splitDue(planned, at('12:00'), new Set(['a', 'b', 'c']));
    expect(due).toEqual([]);
    expect(next).toBeNull();
  });

  it('has no next reminder when none is left', () => {
    expect(splitDue([], at('10:00'), new Set()).next).toBeNull();
  });
});

describe('timing', () => {
  it('delays until the reminder, never negative', () => {
    expect(delayUntil(reminder('a', '10:00'), at('09:59'))).toBe(60_000);
    expect(delayUntil(reminder('a', '10:00'), at('10:05'))).toBe(0);
  });

  it('limits the lookback to 15 minutes', () => {
    expect(planFrom(at('09:55'), at('10:00'))).toEqual(at('09:55'));
    expect(planFrom(at('06:00'), at('10:00'))).toEqual(at('09:45'));
  });

  it('notices a clock jump', () => {
    expect(clockJumped(0, 30_000, 30_000)).toBe(false);
    expect(clockJumped(0, 8 * 3_600_000, 30_000)).toBe(true);
  });
});
