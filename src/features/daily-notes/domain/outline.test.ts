import { describe, expect, it } from 'vitest';
import { applyEdit, onEnter, onTab } from './outline.ts';

const enter = (text: string, at = text.length) => {
  const edit = onEnter(text, at, at);
  return edit && { text: applyEdit(text, edit), caret: edit.caret };
};
const tab = (text: string, at: number, shift: boolean) => {
  const edit = onTab(text, at, at, shift);
  return edit && { text: applyEdit(text, edit), caret: edit.caret };
};

describe('onEnter', () => {
  it('continues a bullet', () => {
    const text = '- Call the bank';
    expect(enter(text)).toEqual({ text: '- Call the bank\n- ', caret: text.length + 3 });
  });

  it('continues a star bullet and keeps the indentation', () => {
    expect(enter('  * Fees')?.text).toBe('  * Fees\n  * ');
  });

  it('continues a checkbox as an unchecked one, whatever the old state', () => {
    expect(enter('  - [x] Gym')?.text).toBe('  - [x] Gym\n  - [ ] ');
    expect(enter('- [ ] Gym')?.text).toBe('- [ ] Gym\n- [ ] ');
  });

  it('ends the list on a line holding only a marker', () => {
    expect(enter('- Call\n- ')).toEqual({ text: '- Call\n', caret: 7 });
    expect(enter('- [ ] ')?.text).toBe('');
  });

  it('acts normally on a plain line, in the middle of a line and with a selection', () => {
    expect(enter('Call the bank')).toBeNull();
    expect(enter('- Call the bank', 4)).toBeNull();
    expect(onEnter('- Call', 2, 6)).toBeNull();
  });

  it('continues the line the cursor is on, not the last one', () => {
    expect(enter('- one\nplain', 5)?.text).toBe('- one\n- \nplain');
  });
});

describe('onTab', () => {
  it('indents and outdents a list line, keeping the caret in the text', () => {
    expect(tab('- Groceries', 4, false)).toEqual({ text: '  - Groceries', caret: 6 });
    expect(tab('  - Groceries', 6, true)).toEqual({ text: '- Groceries', caret: 4 });
  });

  it('removes only one space when there is one', () => {
    expect(tab(' - A', 3, true)?.text).toBe('- A');
  });

  it('works on the line of the cursor in a longer note', () => {
    expect(tab('# Plan\n- A\n- B', 11, false)?.text).toBe('# Plan\n- A\n  - B');
  });

  it('leaves plain lines, unindented outdents and multi-line selections to the default', () => {
    expect(tab('Call the bank', 3, false)).toBeNull();
    expect(tab('- A', 2, true)).toBeNull();
    expect(onTab('- A\n- B', 1, 6, false)).toBeNull();
  });
});
