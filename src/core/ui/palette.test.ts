import { describe, expect, it } from 'vitest';
import { GOAL_COLORS, goalColor } from './palette.ts';

describe('goalColor', () => {
  it('uses the own color when set', () => {
    expect(goalColor({ color: '#123456' }, 3)).toBe('#123456');
  });

  it('goes back to the color by position when set to Auto (null)', () => {
    expect(goalColor({ color: null }, 0)).toBe(GOAL_COLORS[0]);
    expect(goalColor({ color: null }, 2)).toBe(GOAL_COLORS[2]);
    expect(goalColor({ color: null }, 9)).toBe(GOAL_COLORS[1]);
  });
});
