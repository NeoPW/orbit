import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { formatElapsed } from '../domain/timer.ts';
import styles from './StopDialog.module.css';

export interface StopDialogProps {
  /** What the timer ran for. */
  title: string;
  elapsedMs: number;
  /** Offers "Mark as done today" (a habit session whose habit is not checked yet). */
  offerMarkDone?: boolean;
  /** Stops the timer with the (possibly empty) answer. */
  onStop: (note: string, markDone: boolean) => void;
  onCancel: () => void;
}

/** "What did you get done?": the optional answer becomes the note of the log entry. Render it only while it is open. */
export function StopDialog({ title, elapsedMs, offerMarkDone = false, onStop, onCancel }: StopDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [note, setNote] = useState('');
  const [markDone, setMarkDone] = useState(true);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('input')?.focus();
    return () => dialog.close();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    onStop(note, offerMarkDone && markDone);
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <h2 id={titleId}>What did you get done?</h2>
        <p className={styles.hint}>
          {title} &middot; {formatElapsed(elapsedMs)}
        </p>
        <TextField label="Note (optional)" type="text" value={note} onChange={(event) => setNote(event.target.value)} />
        {offerMarkDone && <Checkbox label="Mark as done today" checked={markDone} onChange={setMarkDone} />}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Stop and log
          </Button>
        </div>
      </form>
    </dialog>
  );
}
