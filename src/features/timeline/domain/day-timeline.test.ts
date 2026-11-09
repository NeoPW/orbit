import { describe, expect, it } from 'vitest';
import { axisFor, blockTimes, layoutDay, localRange, shiftDay, type TimeSpan } from './day-timeline.ts';

const at = (hhmm: string, day = '2026-10-14') => new Date(`${day}T${hhmm}:00`);
const block = (from: string, to: string, day?: string): TimeSpan => ({ kind: 'block', start: at(from, day), end: at(to, day) });

describe('blockTimes', () => {
  it('starts a timer entry at its time', () => {
    const t = blockTimes({ source: 'timer', occurredAt: at('09:00').toISOString(), durationMinutes: 45 });
    expect([t.start, t.end]).toEqual([at('09:00'), at('09:45')]);
  });

  it('ends a manual entry at its time', () => {
    const t = blockTimes({ source: 'manual', occurredAt: at('14:30').toISOString(), durationMinutes: 60 });
    expect([t.start, t.end]).toEqual([at('13:30'), at('14:30')]);
  });

  it('gives an entry without duration the same start and end', () => {
    const t = blockTimes({ source: 'task', occurredAt: at('11:20').toISOString(), durationMinutes: null });
    expect(t.start).toEqual(t.end);
  });
});

describe('layoutDay', () => {
  it('places overlapping blocks side by side', () => {
    const [a, b] = layoutDay([block('10:00', '11:00'), block('10:30', '11:30')], '2026-10-14');
    expect([a?.lane, a?.lanes, b?.lane, b?.lanes]).toEqual([0, 2, 1, 2]);
  });

  it('keeps separate groups at full width and reuses lanes', () => {
    const placed = layoutDay([block('09:00', '10:00'), block('10:00', '11:00'), block('13:00', '14:00')], '2026-10-14');
    expect(placed.map((p) => [p.lane, p.lanes])).toEqual([
      [0, 1],
      [0, 1],
      [0, 1],
    ]);
  });

  it('draws a short block at the minimum length and markers without a lane', () => {
    const marker: TimeSpan = { kind: 'marker', start: at('09:05'), end: at('09:05') };
    const [short, mark] = layoutDay([block('09:00', '09:05'), marker], '2026-10-14');
    expect(short?.endMin).toBe(9 * 60 + 15);
    expect([mark?.startMin, mark?.endMin, mark?.lanes]).toEqual([9 * 60 + 5, 9 * 60 + 5, 1]);
  });

  it('takes the minimum block length from the view', () => {
    expect(layoutDay([block('09:00', '09:05')], '2026-10-14', 30)[0]?.endMin).toBe(9 * 60 + 30);
    expect(layoutDay([block('09:00', '10:00')], '2026-10-14', 30)[0]?.endMin).toBe(10 * 60);
  });

  it('leaves out another day and cuts a block at midnight', () => {
    expect(layoutDay([block('09:00', '10:00', '2026-10-13')], '2026-10-14')).toEqual([]);
    const overnight: TimeSpan = { kind: 'block', start: at('23:00', '2026-10-13'), end: at('01:00', '2026-10-14') };
    expect(layoutDay([overnight], '2026-10-13')[0]?.endMin).toBe(1440);
    const next = layoutDay([overnight], '2026-10-14')[0];
    expect([next?.startMin, next?.endMin]).toEqual([0, 60]);
  });
});

describe('axisFor', () => {
  it('runs 06:00–22:00 by default', () => {
    expect(axisFor([layoutDay([block('09:00', '17:00')], '2026-10-14')])).toEqual({ startHour: 6, endHour: 22 });
  });

  it('extends by whole hours for early and late work', () => {
    expect(axisFor([layoutDay([block('05:10', '06:00'), block('22:10', '22:40')], '2026-10-14')])).toEqual({ startHour: 5, endHour: 23 });
  });

  it('shares one axis across days', () => {
    const mon = layoutDay([block('04:30', '05:00', '2026-10-12')], '2026-10-12');
    const wed = layoutDay([block('21:00', '23:30', '2026-10-14')], '2026-10-14');
    expect(axisFor([mon, wed])).toEqual({ startHour: 4, endHour: 24 });
  });
});

describe('localRange', () => {
  it('spans the local midnights', () => {
    const range = localRange('2026-10-14', '2026-10-15');
    expect(range.from).toBe(new Date(2026, 9, 14).toISOString());
    expect(range.to).toBe(new Date(2026, 9, 15).toISOString());
  });
});

describe('shiftDay', () => {
  it('goes to the previous day, across months', () => {
    expect(shiftDay('2026-11-12', -1, '2026-11-12')).toBe('2026-11-11');
    expect(shiftDay('2026-11-01', -1, '2026-11-12')).toBe('2026-10-31');
  });

  it('goes to the next day but not beyond today', () => {
    expect(shiftDay('2026-11-10', 1, '2026-11-12')).toBe('2026-11-11');
    expect(shiftDay('2026-11-12', 1, '2026-11-12')).toBe('2026-11-12');
  });
});
