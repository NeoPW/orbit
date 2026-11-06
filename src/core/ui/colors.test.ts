import { describe, expect, it } from 'vitest';
import { SLOTS, colorLabel, colorToCss, cssToStored, goalColor, isSlot, pickSlot, projectColor, slotColor } from './colors.ts';

describe('slots', () => {
  it('renders a slot as a CSS variable', () => {
    expect(slotColor('pc3')).toBe('var(--pc3)');
    expect(isSlot('pc7')).toBe(true);
    expect(isSlot('pc8')).toBe(false);
    expect(isSlot('#FB7185')).toBe(false);
  });
});

describe('pickSlot', () => {
  it('gives different colours for projects created in a row (Colours differ)', () => {
    const used: string[] = [];
    for (let i = 0; i < 3; i++) used.push(pickSlot(used));
    expect(new Set(used).size).toBe(3);
  });

  it('starts with the first slot and takes the first on a tie', () => {
    expect(pickSlot([])).toBe('pc0');
    expect(pickSlot([null, '#123456'])).toBe('pc0');
  });

  it('takes the freed slot when all eight were used once (Least used first)', () => {
    expect(pickSlot(SLOTS.filter((s) => s !== 'pc5'))).toBe('pc5');
  });

  it('takes the least used slot when all are used', () => {
    expect(pickSlot([...SLOTS, ...SLOTS.filter((s) => s !== 'pc2')])).toBe('pc2');
  });
});

describe('projectColor', () => {
  it('uses the stored slot', () => {
    expect(projectColor({ id: 'x', color: 'pc6' })).toBe('var(--pc6)');
  });

  it('derives a stable slot from the id when none is stored (Older project)', () => {
    const a = projectColor({ id: 'project-1', color: null });
    expect(a).toMatch(/^var\(--pc[0-7]\)$/);
    expect(projectColor({ id: 'project-1', color: null })).toBe(a);
    const spread = new Set(Array.from({ length: 40 }, (_, i) => projectColor({ id: `id-${i}`, color: null })));
    expect(spread.size).toBeGreaterThan(4);
  });

  it('ignores an unknown stored value', () => {
    expect(projectColor({ id: 'a', color: 'bogus' })).toBe(projectColor({ id: 'a', color: null }));
  });
});

describe('goalColor', () => {
  it('uses a stored slot', () => {
    expect(goalColor({ color: 'pc1' }, 5)).toBe('var(--pc1)');
  });

  it('keeps a legacy hex colour as it is (Older goal colour)', () => {
    expect(goalColor({ color: '#FB7185' }, 3)).toBe('#FB7185');
  });

  it('uses the slot of its position when set to Auto (Back to Auto)', () => {
    expect(goalColor({ color: null }, 0)).toBe('var(--pc0)');
    expect(goalColor({ color: null }, 2)).toBe('var(--pc2)');
    expect(goalColor({ color: null }, 9)).toBe('var(--pc1)');
  });
});

describe('picker conversions', () => {
  it('maps between stored values and CSS', () => {
    expect(colorToCss('pc2')).toBe('var(--pc2)');
    expect(colorToCss('#FB7185')).toBe('#FB7185');
    expect(colorToCss(null)).toBeNull();
    expect(cssToStored('var(--pc2)')).toBe('pc2');
    expect(cssToStored('#FB7185')).toBe('#FB7185');
    expect(colorLabel('var(--pc0)')).toBe('Colour 1');
  });
});
