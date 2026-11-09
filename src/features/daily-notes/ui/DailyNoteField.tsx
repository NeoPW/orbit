import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { dailyNoteRequest } from '../../../app/shortcuts/requests.ts';
import { useServices } from '../../../app/services.ts';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { NOTE_SAVE_DELAY_MS } from '../../notes/ui/NoteField.tsx';
import { getDailyNote, saveDailyNote } from '../data/daily-notes-repository.ts';
import { toggleCheckbox } from '../domain/markdown.ts';
import { onEnter, onTab, type OutlineEdit } from '../domain/outline.ts';
import { DailyNoteView } from './DailyNoteView.tsx';
import styles from './DailyNoteField.module.css';

const clock = () => new Date();

/**
 * Replaces a range of the field and puts the caret at `edit.caret`. `execCommand` keeps the browser's undo
 * history (Ctrl+Z undoes the edit); without it the text is set directly.
 */
function applyEdit(field: HTMLTextAreaElement, edit: OutlineEdit): void {
  field.setSelectionRange(edit.start, edit.end);
  const done = edit.insert === '' ? document.execCommand('delete') : document.execCommand('insertText', false, edit.insert);
  if (!done) {
    field.setRangeText(edit.insert, edit.start, edit.end, 'end');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  field.setSelectionRange(edit.caret, edit.caret);
}

/**
 * Home's "Today's note": the daily note of `date`, saved 500 ms after typing stops, on blur and when the field goes
 * away (an emptied note is deleted). It is shown formatted while not focused; clicking it, Enter on it or `N` edits
 * the text. The stored note is read once per date, so typing is never overwritten.
 */
export function DailyNoteField({ date }: { date: string }) {
  const { db } = useServices();
  const [text, setText] = useState('');
  const [loadedDate, setLoadedDate] = useState('');
  const [editing, setEditing] = useState(false);
  const latest = useRef({ text: '', dirty: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushRef = useRef<() => void>(() => {});
  const box = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);
  const loaded = loadedDate === date;

  useEffect(() => {
    let active = true;
    latest.current = { text: '', dirty: false };
    void getDailyNote(db, date).then((note) => {
      if (!active) return;
      if (!latest.current.dirty) {
        latest.current.text = note?.note ?? '';
        setText(latest.current.text);
      }
      setLoadedDate(date);
    });
    const flush = () => {
      clearTimeout(timer.current);
      if (!latest.current.dirty) return;
      latest.current.dirty = false;
      void saveDailyNote(db, clock, date, latest.current.text);
    };
    flushRef.current = flush;
    return () => {
      active = false;
      flush();
    };
  }, [db, date]);

  function change(next: string, saveNow = false) {
    latest.current = { text: next, dirty: true };
    setText(next);
    clearTimeout(timer.current);
    if (saveNow) flushRef.current();
    else timer.current = setTimeout(() => flushRef.current(), NOTE_SAVE_DELAY_MS);
  }

  // The text field is shown for an empty note, while editing and until the note is read.
  const showView = loaded && !editing && text.trim() !== '';

  // Put the cursor at the end once the text field is there and enabled (after a click, Enter or `N`).
  useEffect(() => {
    if (!wantFocus.current || showView) return;
    const field = box.current?.querySelector('textarea');
    if (!field || field.disabled) return;
    wantFocus.current = false;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    field.scrollIntoView({ block: 'nearest' });
  });

  function edit() {
    wantFocus.current = true;
    setEditing(true);
  }

  // `N` puts the cursor in the note, also when it asked before Home was shown.
  useEffect(() => dailyNoteRequest.subscribe(edit), []);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    const field = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = field;
    const result =
      event.key === 'Enter' && !event.shiftKey ? onEnter(value, start, end) : event.key === 'Tab' ? onTab(value, start, end, event.shiftKey) : null;
    if (!result) return;
    event.preventDefault();
    applyEdit(field, result);
  }

  return (
    <Tile title={<h2 className={styles.title}>Today&apos;s note</h2>}>
      <div ref={box}>
        {showView ? (
          <div
            className={styles.viewBox}
            tabIndex={0}
            aria-label="Today's note, press Enter to edit"
            role="group"
            onClick={(event) => {
              if (!(event.target as HTMLElement).closest('label, input')) edit();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.target === event.currentTarget) edit();
            }}
          >
            <DailyNoteView text={text} onToggle={(line) => change(toggleCheckbox(latest.current.text, line), true)} />
          </div>
        ) : (
          <textarea
            className={styles.field}
            aria-label="Today's note"
            rows={3}
            value={text}
            disabled={!loaded}
            onFocus={() => setEditing(true)}
            onChange={(event) => change(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              flushRef.current();
              setEditing(false);
            }}
          />
        )}
      </div>
    </Tile>
  );
}
