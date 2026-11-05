import { describe, expect, it } from 'vitest';
import { promptAfterStop, elapsedMs, formatElapsed, formatOvertime, loggedMinutes } from './timer.ts';

describe('timer', () => {
  it('shows a running timer as h:mm:ss', () => {
    expect(formatElapsed((3600 + 5 * 60 + 3) * 1000)).toBe('1:05:03');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(0)).toBe('0:00');
  });

  it('counts from the start time', () => {
    expect(formatElapsed(elapsedMs('2026-11-05T09:00:00Z', new Date('2026-11-05T09:40:00Z')))).toBe('40:00');
  });

  it('shows overtime after the planned length', () => {
    const elapsed = (27 * 60 + 10) * 1000;
    expect(formatOvertime(elapsed, 25)).toBe('+2:10');
    expect(formatOvertime(24 * 60_000, 25)).toBeNull();
    expect(formatOvertime(elapsed, null)).toBeNull();
  });

  it('logs at least one minute', () => {
    expect(loggedMinutes(20_000)).toBe(1);
    expect(loggedMinutes(45 * 60_000 + 59_000)).toBe(45);
  });

  it('asks for the next step after a task that was completed while timing left its project without one', () => {
    const base = {
      task: { status: 'done' as const, completedAt: '2026-11-05T09:30:00Z', projectId: 'p' },
      projectActive: true,
      openNextSteps: 0,
      startedAt: '2026-11-05T09:00:00Z',
    };
    expect(promptAfterStop(base)).toBe(true);
    expect(promptAfterStop({ ...base, openNextSteps: 1 })).toBe(false);
    expect(promptAfterStop({ ...base, task: { ...base.task, status: 'open' } })).toBe(false);
    expect(promptAfterStop({ ...base, task: { ...base.task, completedAt: '2026-11-04T09:30:00Z' } })).toBe(false);
    expect(promptAfterStop({ ...base, task: null })).toBe(false);
  });
});
