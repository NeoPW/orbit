import { describe, expect, it } from 'vitest';
import { archiveItems, filterByArea, withoutActiveGoal } from './plan.ts';

describe('withoutActiveGoal', () => {
  it('keeps projects without a goal and with a goal that is not active', () => {
    const views = [
      { id: 'none', goalStatus: null },
      { id: 'done', goalStatus: 'completed' as const },
      { id: 'live', goalStatus: 'active' as const },
    ];
    expect(withoutActiveGoal(views).map((v) => v.id)).toEqual(['none', 'done']);
  });
});

describe('filterByArea', () => {
  const views = [
    { id: 'a', project: { areaId: 'uni' } },
    { id: 'b', project: { areaId: null } },
    { id: 'c', project: { areaId: 'home' } },
  ];
  it('shows all areas by default', () => expect(filterByArea(views, undefined)).toHaveLength(3));
  it('filters by area', () => expect(filterByArea(views, 'uni').map((v) => v.id)).toEqual(['a']));
  it('filters on no area', () => expect(filterByArea(views, null).map((v) => v.id)).toEqual(['b']));
});

describe('archiveItems', () => {
  it('lists goals and projects most recently updated first', () => {
    const items = archiveItems(
      [{ id: 'g1', updatedAt: '2026-01-02' }],
      [{ id: 'p1', project: { updatedAt: '2026-01-03' } }, { id: 'p2', project: { updatedAt: '2026-01-01' } }],
    );
    expect(items.map((i) => i.item.id)).toEqual(['p1', 'g1', 'p2']);
  });
});
