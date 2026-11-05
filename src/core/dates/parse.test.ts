import { describe, expect, it } from 'vitest';
import { formatTime, parseDate, parseTime } from './parse.ts';

describe('parseDate', () => {
  it('turns dd-mm-yyyy into yyyy-mm-dd', () => {
    expect(parseDate('05-03-2026')).toEqual({ ok: true, value: '2026-03-05' });
    expect(parseDate(' 5-3-2026 ')).toEqual({ ok: true, value: '2026-03-05' });
  });

  it('rejects other formats and dates that do not exist', () => {
    for (const text of ['', '2026-03-05', '31-02-2026', '00-01-2026', '1-13-2026', 'abc', '05/03/2026']) {
      expect(parseDate(text).ok, text).toBe(false);
    }
    expect(parseDate('29-02-2028').ok).toBe(true);
    expect(parseDate('29-02-2027').ok).toBe(false);
  });
});

describe('parseTime and formatTime', () => {
  it('parses HH:mm and pads', () => {
    expect(parseTime('07:15')).toEqual({ ok: true, value: '07:15' });
    expect(parseTime('7:05')).toEqual({ ok: true, value: '07:05' });
    expect(formatTime(7, 5)).toBe('07:05');
  });

  it('rejects out-of-range and malformed times', () => {
    for (const text of ['', '24:00', '12:60', '1215', '12:5', 'ab:cd']) {
      expect(parseTime(text).ok, text).toBe(false);
    }
  });
});
