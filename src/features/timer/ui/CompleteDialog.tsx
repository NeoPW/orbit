import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { formatElapsed } from '../domain/timer.ts';
import styles from './CompleteDialog.module.css';

export interface CompleteDialogProps {
  /** What the timer ran for. */
  title: string;
  workedMs: number;
  /** Offers "Mark as done today" (a habit session whose habit is not checked yet). */
  offerMarkDone?: boolean;
  /** Completes the session with the (possibly empty) answer. */
  onComplete: (note: string, markDone: boolean) => void;
  onCancel: () => void;
}

/** "What did you get done?": the optional answer becomes the note of the last logged stretch. Render it only while it is open. */
export function CompleteDialog({ title, workedMs, offerMarkDone = false, onComplete, onCancel }: CompleteDialogProps) {
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
    onComplete(note, offerMarkDone && markDone);
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
          {title} &middot; {formatElapsed(workedMs)}
        </p>
        <TextField label="Note (optional)" type="text" value={note} onChange={(event) => setNote(event.target.value)} />
        {offerMarkDone && <Checkbox label="Mark as done today" checked={markDone} onChange={setMarkDone} />}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Complete
          </Button>
        </div>
      </form>
    </dialog>
  );
}
