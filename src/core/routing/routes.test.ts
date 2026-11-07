import { describe, expect, it } from 'vitest';
import { parsePath, pathOf, sectionOf, type Route } from './routes.ts';

describe('parsePath', () => {
  it('opens a destination at its own path without redirect', () => {
    expect(parsePath('/plan')).toEqual({ route: { name: 'plan' } });
    expect(parsePath('/settings')).toEqual({ route: { name: 'settings' } });
  });

  it('shows Home under /home for an unknown path', () => {
    expect(parsePath('/does-not-exist')).toEqual({ route: { name: 'home' }, redirect: '/home' });
  });

  it('shows Home under /home for the root path', () => {
    expect(parsePath('/')).toEqual({ route: { name: 'home' }, redirect: '/home' });
  });

  it('keeps the gallery out of production', () => {
    expect(parsePath('/dev/components').route).toEqual({ name: 'home' });
    expect(parsePath('/dev/components', { dev: true })).toEqual({ route: { name: 'dev-components' } });
  });
});

describe('pathOf', () => {
  it('round-trips with parsePath', () => {
    for (const name of ['home', 'plan', 'review', 'settings'] as const) {
      expect(parsePath(pathOf({ name })).route).toEqual({ name });
    }
  });
});

const DETAIL_ROUTES: Route[] = [
  { name: 'goal', id: 'g-1' },
  { name: 'project', id: 'p-1' },
  { name: 'task', id: 't-1' },
  { name: 'review-history', id: 'r-1' },
  { name: 'review-flow' },
  { name: 'review-flow', step: 'goals' },
  { name: 'review', week: '2026-10-26' },
  { name: 'focus' },
];

describe('detail paths', () => {
  it('uses /goals/<id>, /projects/<id>, /tasks/<id> and the review and focus paths', () => {
    expect(pathOf({ name: 'goal', id: 'abc' })).toBe('/goals/abc');
    expect(pathOf({ name: 'project', id: 'abc' })).toBe('/projects/abc');
    expect(pathOf({ name: 'task', id: 'abc' })).toBe('/tasks/abc');
    expect(pathOf({ name: 'review-flow' })).toBe('/review/flow');
    expect(pathOf({ name: 'review-history', id: 'abc' })).toBe('/review/history/abc');
    expect(pathOf({ name: 'review', week: '2026-10-26' })).toBe('/review?week=2026-10-26');
    expect(pathOf({ name: 'focus' })).toBe('/focus');
  });

  it('shows the same page again after a reload (parse round trip)', () => {
    for (const route of DETAIL_ROUTES) {
      expect(parsePath(pathOf(route)), pathOf(route)).toEqual({ route });
    }
  });

  it('opens the Review tab on the current week without a valid week', () => {
    expect(parsePath('/review').route).toEqual({ name: 'review' });
    expect(parsePath('/review?week=soon').route).toEqual({ name: 'review' });
  });

  it('no longer has a Last week page', () => {
    expect(parsePath('/review/last-week').route).toEqual({ name: 'home' });
  });

  it('opens the Today screen at /today', () => {
    expect(parsePath('/today').route).toEqual({ name: 'today' });
    expect(pathOf({ name: 'today' })).toBe('/today');
  });

  it('falls back to Home for a detail path without id', () => {
    expect(parsePath('/projects/').route).toEqual({ name: 'home' });
    expect(parsePath('/goals/a/b').route).toEqual({ name: 'home' });
  });
});

describe('sectionOf', () => {
  it('marks Plan on goal, project and task pages', () => {
    expect(sectionOf({ name: 'task', id: 't' })).toBe('plan');
    expect(sectionOf({ name: 'goal', id: 'g' })).toBe('plan');
    expect(sectionOf({ name: 'project', id: 'p' })).toBe('plan');
  });

  it('marks Review on the review pages and the destinations on themselves', () => {
    expect(sectionOf({ name: 'review-flow' })).toBe('review');
    expect(sectionOf({ name: 'review-history', id: 'r' })).toBe('review');
    expect(sectionOf({ name: 'home' })).toBe('home');
    expect(sectionOf({ name: 'settings' })).toBe('settings');
    expect(sectionOf({ name: 'today' })).toBe('today');
  });
});
