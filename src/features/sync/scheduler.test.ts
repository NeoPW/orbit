import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSyncScheduler } from './scheduler.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup() {
  let runs = 0;
  let foregrounded: (() => void) | undefined;
  const scheduler = createSyncScheduler({
    run: async () => {
      runs++;
    },
    foreground: (onForeground) => {
      foregrounded = onForeground;
      return () => {
        foregrounded = undefined;
      };
    },
  });
  return { scheduler, runs: () => runs, foreground: () => foregrounded?.() };
}

describe('sync scheduler', () => {
  it('syncs at start and again after a restart', async () => {
    const { scheduler, runs } = setup();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs()).toBe(1);
    scheduler.stop();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs()).toBe(2);
  });

  it('syncs a few seconds after a write, once for several writes', async () => {
    const { scheduler, runs } = setup();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    for (let i = 0; i < 5; i++) {
      scheduler.notifyWrite();
      await vi.advanceTimersByTimeAsync(500);
    }
    expect(runs()).toBe(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(runs()).toBe(2);
  });

  it('syncs when the app returns to the foreground', async () => {
    const { scheduler, runs, foreground } = setup();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    foreground();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs()).toBe(2);
  });

  it('syncs every 5 minutes', async () => {
    const { scheduler, runs } = setup();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(runs()).toBe(2);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(runs()).toBe(3);
  });

  it('runs exactly one more sync for triggers during a running sync', async () => {
    let runs = 0;
    let release: () => void = () => undefined;
    const scheduler = createSyncScheduler({
      run: () => {
        runs++;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      },
      foreground: () => () => undefined,
    });
    scheduler.start(); // run 1 is now in flight
    const first = scheduler.syncNow();
    const second = scheduler.syncNow();
    expect(runs).toBe(1);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(runs).toBe(2); // one follow-up run for both triggers
    release();
    await Promise.all([first, second]);
    await vi.advanceTimersByTimeAsync(0);
    expect(runs).toBe(2);
  });

  it('does nothing after stop', async () => {
    const { scheduler, runs, foreground } = setup();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);
    scheduler.stop();
    scheduler.notifyWrite();
    foreground();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await scheduler.syncNow();
    expect(runs()).toBe(1);
  });
});
