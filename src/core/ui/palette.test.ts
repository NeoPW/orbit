import { describe, expect, it } from 'vitest';
import { AREA_COLORS } from './palette.ts';

describe('AREA_COLORS', () => {
  it('has eight distinct hex colours', () => {
    expect(new Set(AREA_COLORS).size).toBe(8);
    for (const color of AREA_COLORS) expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });
});
