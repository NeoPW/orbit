import { useEffect, useRef, useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { NoteTargetType } from '../../../core/db/schema.ts';
import { TextArea } from '../../../core/ui/components/TextField.tsx';
import { getNote, saveNote } from '../data/notes-repository.ts';

export const NOTE_SAVE_DELAY_MS = 500;

const clock = () => new Date();

export interface NoteFieldProps {
  targetType: NoteTargetType;
  targetId: string;
  /** Monday of the week, `yyyy-mm-dd`. */
  weekStart: string;
  label?: string;
}

/**
 * The weekly note of a project or goal. It is saved 500 ms after typing stops, on blur and when the
 * field goes away; an emptied note is deleted. The stored note is read once, so typing is never overwritten.
 */
export function NoteField({ targetType, targetId, weekStart, label = 'Note' }: NoteFieldProps) {
  const { db } = useServices();
  const [text, setText] = useState('');
  const key = `${targetType}:${targetId}:${weekStart}`;
  const [loadedKey, setLoadedKey] = useState('');
  const latest = useRef({ text: '', dirty: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushRef = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    latest.current = { text: '', dirty: false };
    void getNote(db, targetType, targetId, weekStart).then((note) => {
      if (!active) return;
      if (!latest.current.dirty) {
        latest.current.text = note?.note ?? '';
        setText(latest.current.text);
      }
      setLoadedKey(key);
    });
    const flush = () => {
      clearTimeout(timer.current);
      if (!latest.current.dirty) return;
      latest.current.dirty = false;
      void saveNote(db, clock, targetType, targetId, weekStart, latest.current.text);
    };
    flushRef.current = flush;
    return () => {
      active = false;
      flush();
    };
  }, [db, targetType, targetId, weekStart, key]);

  return (
    <TextArea
      label={label}
      rows={3}
      value={text}
      disabled={loadedKey !== key}
      onChange={(event) => {
        latest.current = { text: event.target.value, dirty: true };
        setText(event.target.value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current(), NOTE_SAVE_DELAY_MS);
      }}
      onBlur={() => flushRef.current()}
    />
  );
}
