import { describe, expect, it } from 'vitest';
import { matchShortcut, withShortcut, type KeyInput } from './keys.ts';

const press = (key: string, more: Partial<KeyInput> = {}): KeyInput => ({
  key,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  editable: false,
  dialogOpen: false,
  onControl: false,
  ...more,
});
const action = (input: KeyInput, scope: 'global' | 'home' | 'focus' = 'global') => matchShortcut(input, scope)?.action ?? null;

describe('global shortcuts', () => {
  it('maps the letters and Shift letters', () => {
    expect(action(press('t'))).toBe('new-task');
    expect(action(press('l'))).toBe('log-work');
    expect(action(press('f'))).toBe('focus-field');
    expect(action(press('P', { shiftKey: true }))).toBe('go-plan');
    expect(action(press('R', { shiftKey: true }))).toBe('go-review');
    expect(action(press('H', { shiftKey: true }))).toBe('go-home');
    expect(action(press('S', { shiftKey: true }))).toBe('go-settings');
    expect(action(press('?', { shiftKey: true }))).toBe('overlay');
    expect(action(press('k', { ctrlKey: true }))).toBe('palette');
  });

  it('does not take Shift+T for T', () => {
    expect(action(press('T', { shiftKey: true }))).toBeNull();
  });

  it('leaves letters to a text field, but opens the palette from it', () => {
    expect(action(press('t', { editable: true }))).toBeNull();
    expect(action(press('k', { ctrlKey: true, editable: true }))).toBe('palette');
  });

  it('does nothing while a dialog or sheet is open, also not Ctrl+K', () => {
    expect(action(press('P', { shiftKey: true, dialogOpen: true }))).toBeNull();
    expect(action(press('k', { ctrlKey: true, dialogOpen: true }))).toBeNull();
  });

  it('leaves browser shortcuts alone', () => {
    expect(action(press('t', { ctrlKey: true }))).toBeNull();
    expect(action(press('l', { altKey: true }))).toBeNull();
  });

  it('gives the tooltip text', () => {
    expect(withShortcut('New task', 'new-task')).toBe('New task (T)');
    expect(withShortcut('Plan', 'go-plan')).toBe('Plan (Shift+P)');
  });
});

describe('To do keys on Home', () => {
  it('moves, starts, completes and opens', () => {
    expect(action(press('j'), 'home')).toBe('todo-next');
    expect(action(press('ArrowDown'), 'home')).toBe('todo-next');
    expect(action(press('k'), 'home')).toBe('todo-prev');
    expect(action(press(' '), 'home')).toBe('todo-start');
    expect(action(press('x'), 'home')).toBe('todo-complete');
    expect(action(press('Enter'), 'home')).toBe('todo-open');
    expect(action(press('t'), 'home')).toBe('new-task');
  });

  it('moves through the habits with the side arrows', () => {
    expect(action(press('ArrowLeft'), 'home')).toBe('habit-prev');
    expect(action(press('ArrowRight'), 'home')).toBe('habit-next');
  });

  it('highlights the nth task with 1–9', () => {
    expect(matchShortcut(press('3'), 'home')).toEqual({ action: 'todo-select-n', index: 2 });
    expect(matchShortcut(press('0'), 'home')).toBeNull();
  });

  it('leaves Space and Enter to a focused button', () => {
    expect(action(press(' ', { onControl: true }), 'home')).toBeNull();
    expect(action(press('Enter', { onControl: true }), 'home')).toBeNull();
  });

  it('has no To do keys elsewhere', () => {
    expect(action(press('j'))).toBeNull();
    expect(action(press('3'))).toBeNull();
  });
});

describe('focus mode keys', () => {
  it('maps pause, complete, leave, discard and the limit', () => {
    expect(action(press(' '), 'focus')).toBe('focus-toggle');
    expect(action(press('Enter'), 'focus')).toBe('focus-complete');
    expect(action(press('Escape'), 'focus')).toBe('focus-leave');
    expect(action(press('Delete'), 'focus')).toBe('focus-discard');
    expect(action(press('l'), 'focus')).toBe('focus-limit');
    expect(action(press('+', { shiftKey: true }), 'focus')).toBe('focus-limit-up');
    expect(action(press('-'), 'focus')).toBe('focus-limit-down');
  });
});
