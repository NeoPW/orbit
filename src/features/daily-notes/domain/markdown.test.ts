import { describe, expect, it } from 'vitest';
import { parseInline, parseNote, toggleCheckbox } from './markdown.ts';

describe('parseNote', () => {
  it('reads headings, bullets with depth and emphasis', () => {
    const blocks = parseNote('# Plan\n- **Call** the bank\n  - ask about _fees_');
    expect(blocks).toEqual([
      { kind: 'heading', level: 1, spans: [{ kind: 'text', text: 'Plan' }] },
      {
        kind: 'item', depth: 0, checked: null, line: 1,
        spans: [{ kind: 'bold', text: 'Call' }, { kind: 'text', text: ' the bank' }],
      },
      {
        kind: 'item', depth: 1, checked: null, line: 2,
        spans: [{ kind: 'text', text: 'ask about ' }, { kind: 'italic', text: 'fees' }],
      },
    ]);
  });

  it('reads checkboxes with their state and line, and star bullets', () => {
    const blocks = parseNote('- [ ] Gym\n* [x] Read\n- [X] Cook');
    expect(blocks.map((b) => b.kind === 'item' && [b.checked, b.line])).toEqual([[false, 0], [true, 1], [true, 2]]);
  });

  it('counts a tab as one level and keeps blank lines and plain lines', () => {
    const blocks = parseNote('Call\n\n\t- A');
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'blank', 'item']);
    expect(blocks[2]).toMatchObject({ depth: 1 });
  });

  it('only reads three heading levels and needs the space', () => {
    expect(parseNote('#### Four')[0]?.kind).toBe('paragraph');
    expect(parseNote('#Tag')[0]?.kind).toBe('paragraph');
    expect(parseNote('### Three')[0]).toMatchObject({ kind: 'heading', level: 3 });
  });

  it('keeps HTML as text', () => {
    expect(parseNote('<b>hi</b>')).toEqual([{ kind: 'paragraph', spans: [{ kind: 'text', text: '<b>hi</b>' }] }]);
  });

  it('does not take a bold or italic line for a bullet', () => {
    expect(parseNote('**Bold** line')[0]?.kind).toBe('paragraph');
    expect(parseNote('*Italic* line')[0]?.kind).toBe('paragraph');
  });
});

describe('parseInline', () => {
  it('reads code, bold and both italics', () => {
    expect(parseInline('`x` **b** *i* _j_').map((s) => s.kind)).toEqual(['code', 'text', 'bold', 'text', 'italic', 'text', 'italic']);
  });

  it('leaves unclosed markers, spaced stars and snake_case as text', () => {
    expect(parseInline('**open')).toEqual([{ kind: 'text', text: '**open' }]);
    expect(parseInline('2 * 3 * 4')).toEqual([{ kind: 'text', text: '2 * 3 * 4' }]);
    expect(parseInline('snake_case_name')).toEqual([{ kind: 'text', text: 'snake_case_name' }]);
    expect(parseInline('``')).toEqual([{ kind: 'text', text: '``' }]);
  });
});

describe('toggleCheckbox', () => {
  it('ticks and unticks the line', () => {
    expect(toggleCheckbox('- [ ] Gym\n- [ ] Read', 1)).toBe('- [ ] Gym\n- [x] Read');
    expect(toggleCheckbox('- [x] Gym', 0)).toBe('- [ ] Gym');
    expect(toggleCheckbox('  * [X] Gym', 0)).toBe('  * [ ] Gym');
  });

  it('leaves other lines and missing lines alone', () => {
    expect(toggleCheckbox('- Gym\n[ ] x', 0)).toBe('- Gym\n[ ] x');
    expect(toggleCheckbox('- [ ] A', 5)).toBe('- [ ] A');
  });
});
