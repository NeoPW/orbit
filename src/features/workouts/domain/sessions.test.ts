import { describe, expect, it } from 'vitest';
import { clockTime, formatSet, lastTime, localInstant, runningMinutes, pace, parseSetDuration, prefill, sessionMinutes, toInput, validateSet, type PastSetRow, type SetValues } from './sessions.ts';

const input = (over: Partial<Record<'reps' | 'weight' | 'distance' | 'duration', string>>) => ({ reps: '', weight: '', distance: '', duration: '', ...over });
const strength = (reps: number, weightKg: number): SetValues => ({ reps, weightKg, distance: null, durationSeconds: null });

describe('sets', () => {
  it('logs a strength set', () => {
    const result = validateSet('strength', input({ reps: '8', weight: '60' }));
    expect(result).toEqual({ ok: true, values: strength(8, 60) });
    if (result.ok) expect(formatSet('strength', result.values, null)).toBe('8 × 60 kg');
    expect(validateSet('strength', input({ reps: '6', weight: '62,5' }))).toMatchObject({ values: { weightKg: 62.5 } });
  });

  it('logs an endurance set', () => {
    const result = validateSet('endurance', input({ distance: '5.2', duration: '28:40' }));
    expect(result).toEqual({ ok: true, values: { reps: null, weightKg: null, distance: 5.2, durationSeconds: 1720 } });
    if (result.ok) expect(formatSet('endurance', result.values, 'km')).toBe('5.2 km in 28:40');
  });

  it('rejects zero reps', () => {
    expect(validateSet('bodyweight', input({ reps: '0' }))).toEqual({ ok: false, error: 'Enter at least 1 rep' });
    expect(validateSet('strength', input({ reps: '2.5', weight: '10' }))).toEqual({ ok: false, error: 'Enter at least 1 rep' });
  });

  it('rejects a duration in another form', () => {
    expect(validateSet('endurance', input({ distance: '3', duration: '12' }))).toEqual({ ok: false, error: 'Enter the time as m:ss or h:mm:ss' });
    expect(parseSetDuration('1:05:00')).toBe(3900);
    expect(parseSetDuration('5:75')).toBeNull();
  });

  it('formats bodyweight reps', () => {
    expect(formatSet('bodyweight', { reps: 12, weightKg: null, distance: null, durationSeconds: null }, null)).toBe('12 reps');
  });
});

describe('pace', () => {
  it('is per km for running and per 100 m for swimming', () => {
    expect(pace(5, 27 * 60 + 30, 'km')).toBe('5:30 /km');
    expect(pace(1500, 30 * 60, 'm')).toBe('2:00 /100 m');
  });
});

describe('session length', () => {
  it('is at least one minute', () => {
    expect(sessionMinutes('2026-11-10T17:05:00Z', '2026-11-10T17:05:20Z')).toBe(1);
    expect(sessionMinutes('2026-11-10T17:05:00Z', '2026-11-10T18:10:00Z')).toBe(65);
  });
});

describe('last time', () => {
  const row = (sessionId: string, startedAt: string, position: number, reps: number, weightKg: number, exerciseId = 'bench'): PastSetRow => ({
    exerciseId,
    sessionId,
    startedAt,
    position,
    ...strength(reps, weightKg),
  });
  const rows = [
    row('full-body', '2026-11-08T17:00:00Z', 1, 6, 62.5),
    row('full-body', '2026-11-08T17:00:00Z', 0, 8, 60),
    row('older', '2026-11-01T17:00:00Z', 0, 5, 50),
    row('older', '2026-11-01T17:00:00Z', 0, 10, 0, 'dips'),
  ];

  it('takes the most recent session with the exercise, from any workout', () => {
    expect(lastTime('bench', rows)).toEqual({ sessionId: 'full-body', startedAt: '2026-11-08T17:00:00Z', sets: [strength(8, 60), strength(6, 62.5)] });
  });

  it('prefills the first set from last time', () => {
    const last = lastTime('bench', rows)?.sets ?? [];
    expect(prefill(last, [])).toEqual(strength(8, 60));
    expect(toInput(prefill(last, []))).toEqual({ reps: '8', weight: '60', distance: '', duration: '' });
  });

  it("prefills past last time's sets with this session's last set", () => {
    const last = [strength(8, 60), strength(6, 62.5)];
    expect(prefill(last, [strength(8, 60), strength(8, 60), strength(8, 61)])).toEqual(strength(8, 61));
    expect(prefill([strength(8, 60)], [])).toEqual(strength(8, 60));
  });

  it('is empty when never done', () => {
    expect(lastTime('squat', rows)).toBeNull();
    expect(prefill([], [])).toBeNull();
    expect(toInput(null)).toEqual({ reps: '', weight: '', distance: '', duration: '' });
  });
});

describe('times', () => {
  it('converts between local times and instants', () => {
    const iso = localInstant('2026-11-10', '18:05');
    expect(clockTime(iso)).toBe('18:05');
    expect(runningMinutes(iso, new Date(new Date(iso).getTime() + 35 * 60000 + 20000))).toBe(35);
  });
});
