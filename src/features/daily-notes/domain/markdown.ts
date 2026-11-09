/** The small Markdown subset of the daily note (see openspec daily-notes, "Formatted note"). */

export interface Span {
  kind: 'text' | 'bold' | 'italic' | 'code';
  text: string;
}

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; spans: Span[] }
  /** `checked` is null for a plain bullet; `line` is the index of its line in the note. */
  | { kind: 'item'; depth: number; checked: boolean | null; line: number; spans: Span[] }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'blank' };

const WORD = /[\p{L}\p{N}]/u;

/** `**bold**`, `*italic*`, `_italic_` and `` `code` `` into spans; a marker without its partner stays text. */
export function parseInline(text: string): Span[] {
  const spans: Span[] = [];
  let plain = '';
  const flush = () => {
    if (plain) spans.push({ kind: 'text', text: plain });
    plain = '';
  };
  // The content between markers must not touch whitespace, so "2 * 3 * 4" stays text.
  const wrapped = (content: string) => content.length > 0 && !/^\s|\s$/.test(content);
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    let kind: Span['kind'] | null = null;
    let marker = '';
    if (rest.startsWith('`')) [kind, marker] = ['code', '`'];
    else if (rest.startsWith('**')) [kind, marker] = ['bold', '**'];
    else if (rest.startsWith('*')) [kind, marker] = ['italic', '*'];
    else if (rest.startsWith('_') && !WORD.test(text[i - 1] ?? ' ')) [kind, marker] = ['italic', '_'];
    if (kind) {
      const close = text.indexOf(marker, i + marker.length);
      const content = close === -1 ? '' : text.slice(i + marker.length, close);
      const closesWord = marker === '_' && close !== -1 && WORD.test(text[close + 1] ?? ' ');
      if (close !== -1 && !closesWord && (kind === 'code' ? content.length > 0 : wrapped(content))) {
        flush();
        spans.push({ kind, text: content });
        i = close + marker.length;
        continue;
      }
    }
    plain += text[i];
    i += 1;
  }
  flush();
  return spans;
}

const HEADING = /^(#{1,3}) (.*)$/;
const ITEM = /^([ \t]*)[-*] (?:\[([ xX])\] )?(.*)$/;

/** The note as blocks, one per line. */
export function parseNote(text: string): Block[] {
  return text.split('\n').map((line, index): Block => {
    const heading = HEADING.exec(line);
    if (heading) return { kind: 'heading', level: heading[1]!.length as 1 | 2 | 3, spans: parseInline(heading[2]!) };
    const item = ITEM.exec(line);
    if (item) {
      const width = [...item[1]!].reduce((sum, c) => sum + (c === '\t' ? 2 : 1), 0);
      return {
        kind: 'item',
        depth: Math.floor(width / 2),
        checked: item[2] === undefined ? null : item[2] !== ' ',
        line: index,
        spans: parseInline(item[3]!),
      };
    }
    if (line.trim() === '') return { kind: 'blank' };
    return { kind: 'paragraph', spans: parseInline(line) };
  });
}

/** Switches the checkbox on the given line between `[ ]` and `[x]`; any other line leaves the text as it is. */
export function toggleCheckbox(text: string, line: number): string {
  const lines = text.split('\n');
  const current = lines[line];
  if (current === undefined) return text;
  lines[line] = current.replace(/^([ \t]*[-*] \[)([ xX])(\] )/, (_, before: string, mark: string, after: string) => `${before}${mark === ' ' ? 'x' : ' '}${after}`);
  return lines.join('\n');
}
