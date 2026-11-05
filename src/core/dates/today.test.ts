import { describe, expect, it } from 'vitest';
import { addDays, msUntilMidnight } from './today.ts';

describe('msUntilMidnight', () => {
  it('counts to the next local midnight', () => {
    expect(msUntilMidnight(new Date(2026, 10, 5, 23, 59, 0))).toBe(60_000);
    expect(msUntilMidnight(new Date(2026, 10, 5, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });
});

describe('addDays', () => {
  it('moves across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});
