/** An edit to apply to a text field: replace `start`–`end` with `insert`, then put the caret at `caret`. */
export interface OutlineEdit {
  start: number;
  end: number;
  insert: string;
  caret: number;
}

/** A list line: indentation, then `- `, `* ` or a checkbox (`- [ ] `, `- [x] `). */
const MARKER = /^([ \t]*)([-*])( \[[ xX]\])? /;

function lineBounds(text: string, at: number): { lineStart: number; lineEnd: number } {
  const lineStart = text.lastIndexOf('\n', at - 1) + 1;
  const next = text.indexOf('\n', at);
  return { lineStart, lineEnd: next === -1 ? text.length : next };
}

/**
 * Enter at the end of a list line starts the next item with the same indentation and marker (an unchecked
 * checkbox after a checkbox); on a line holding only a marker it empties the line instead. Null when Enter
 * should act normally.
 */
export function onEnter(text: string, start: number, end: number): OutlineEdit | null {
  if (start !== end) return null;
  const { lineStart, lineEnd } = lineBounds(text, start);
  if (start !== lineEnd) return null;
  const line = text.slice(lineStart, lineEnd);
  const match = MARKER.exec(line);
  if (!match) return null;
  if (match[0] === line) return { start: lineStart, end: lineEnd, insert: '', caret: lineStart };
  const insert = `\n${match[1]}${match[2]}${match[3] ? ' [ ]' : ''} `;
  return { start, end, insert, caret: start + insert.length };
}

/**
 * Tab indents a list line by two spaces and Shift+Tab removes up to two; the caret keeps its place in the
 * text. Null for other lines, for a selection over several lines and when there is nothing to remove, so
 * the key moves the focus as usual.
 */
export function onTab(text: string, start: number, end: number, shift: boolean): OutlineEdit | null {
  if (text.slice(start, end).includes('\n')) return null;
  const { lineStart, lineEnd } = lineBounds(text, start);
  const line = text.slice(lineStart, lineEnd);
  if (!MARKER.test(line)) return null;
  if (!shift) return { start: lineStart, end: lineStart, insert: '  ', caret: start + 2 };
  const spaces = Math.min(2, /^ */.exec(line)?.[0].length ?? 0);
  if (spaces === 0) return null;
  return { start: lineStart, end: lineStart + spaces, insert: '', caret: Math.max(lineStart, start - spaces) };
}

/** The text after an edit, for tests and fallbacks. */
export function applyEdit(text: string, edit: OutlineEdit): string {
  return text.slice(0, edit.start) + edit.insert + text.slice(edit.end);
}
