import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMessenger } from './messenger.ts';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createMessenger', () => {
  it('closes a message on its own after 3 seconds', () => {
    const m = createMessenger();
    m.show({ text: 'Task completed' });
    vi.advanceTimersByTime(2999);
    expect(m.current()?.text).toBe('Task completed');
    vi.advanceTimersByTime(1);
    expect(m.current()).toBeNull();
  });

  it('stays while the pointer is on it and closes 3 seconds after it leaves', () => {
    const m = createMessenger();
    m.show({ text: 'Task completed' });
    vi.advanceTimersByTime(1000);
    m.pause();
    vi.advanceTimersByTime(5000);
    expect(m.current()).not.toBeNull();
    m.resume();
    vi.advanceTimersByTime(2999);
    expect(m.current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(m.current()).toBeNull();
  });

  it('closes at once with the close button', () => {
    const m = createMessenger();
    const listener = vi.fn();
    m.subscribe(listener);
    m.show({ text: 'Work logged' });
    m.dismiss();
    expect(m.current()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('runs the action and closes the message', () => {
    const m = createMessenger();
    const undo = vi.fn();
    m.show({ text: 'Task completed', action: { label: 'Undo', run: undo } });
    m.runAction();
    expect(undo).toHaveBeenCalledOnce();
    expect(m.current()).toBeNull();
  });

  it('replaces the shown message and counts a full 3 seconds for the new one', () => {
    const m = createMessenger();
    m.show({ text: 'First' });
    vi.advanceTimersByTime(2000);
    m.show({ text: 'Second' });
    expect(m.current()?.text).toBe('Second');
    vi.advanceTimersByTime(2999);
    expect(m.current()?.text).toBe('Second');
    vi.advanceTimersByTime(1);
    expect(m.current()).toBeNull();
  });
});
