import { describe, expect, it } from 'vitest';
import { parsePath, pathOf } from './routes.ts';

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
