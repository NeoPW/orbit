import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import type { NextStepChoice, Task } from '../data/tasks-repository.ts';
import styles from './NextStepPrompt.module.css';

export interface NextStepPromptProps {
  /** The task being completed. */
  taskTitle: string;
  /** The project's other open tasks, to pick the next steps from. */
  candidates: Task[];
  /** Any choice but cancel: the task is then completed. */
  onChoose: (choice: NextStepChoice) => void;
  /** Cancel or Escape: nothing changes. */
  onCancel: () => void;
}

/** "What's the next step?": enter a new task, pick open tasks, or skip. Render it only while it is open. */
export function NextStepPrompt({ taskTitle, candidates, onChoose, onCancel }: NextStepPromptProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('input[type="text"]')?.focus();
    return () => dialog.close();
  }, []);

  const canContinue = title.trim() !== '' || picked.size > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() !== '') onChoose({ kind: 'new', title });
    else if (picked.size > 0) onChoose({ kind: 'pick', taskIds: [...picked] });
  }

  function toggle(id: string, on: boolean) {
    setTitle('');
    setPicked((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
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
        <h2 id={titleId}>What&apos;s the next step?</h2>
        <p className={styles.hint}>&ldquo;{taskTitle}&rdquo; is the last next step of its project.</p>
        <TextField
          label="New task"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (event.target.value !== '') setPicked(new Set());
          }}
        />
        {candidates.length > 0 && (
          <fieldset className={styles.pick}>
            <legend className={styles.legend}>Or pick open tasks</legend>
            {candidates.map((task) => (
              <Checkbox key={task.id} label={task.title} checked={picked.has(task.id)} onChange={(on) => toggle(task.id, on)} />
            ))}
          </fieldset>
        )}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onChoose({ kind: 'skip' })}>Skip</Button>
          <Button type="submit" variant="primary" disabled={!canContinue}>
            {title.trim() !== '' ? 'Add and complete' : 'Complete'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
