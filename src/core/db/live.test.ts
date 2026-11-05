import { describe, expect, it } from 'vitest';
import { createReloader, type FrameScheduler } from './live.ts';

/** A scheduler whose frames are run by hand. */
function manualFrames() {
  const pending: (() => void)[] = [];
  const schedule: FrameScheduler = (callback) => {
    pending.push(callback);
    return () => {
      const i = pending.indexOf(callback);
      if (i >= 0) pending.splice(i, 1);
    };
  };
  return { schedule, frame: () => pending.shift()?.(), pending };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createReloader', () => {
  it('runs once for many requests in one frame', async () => {
    const frames = manualFrames();
    let runs = 0;
    const reloader = createReloader(async () => void runs++, frames.schedule);
    reloader.request();
    reloader.request();
    reloader.request();
    expect(runs).toBe(0);
    frames.frame();
    await tick();
    expect(runs).toBe(1);
    expect(frames.pending).toHaveLength(0);
  });

  it('runs once more after a run when a request came during it', async () => {
    const frames = manualFrames();
    let runs = 0;
    let finish: () => void = () => {};
    const reloader = createReloader(() => {
      runs++;
      return new Promise<void>((resolve) => (finish = resolve));
    }, frames.schedule);
    reloader.request();
    frames.frame();
    reloader.request();
    reloader.request();
    expect(frames.pending).toHaveLength(0);
    finish();
    await tick();
    expect(frames.pending).toHaveLength(1);
    frames.frame();
    finish();
    await tick();
    expect(runs).toBe(2);
  });

  it('does not run after dispose', async () => {
    const frames = manualFrames();
    let runs = 0;
    const reloader = createReloader(async () => void runs++, frames.schedule);
    reloader.request();
    reloader.dispose();
    frames.frame();
    await tick();
    expect(runs).toBe(0);
  });
});
