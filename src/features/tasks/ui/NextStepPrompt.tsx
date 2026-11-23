import { Check } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import fieldStyles from '../../../core/ui/components/Field.module.css';
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

/**
 * "What's the next step?": enter a new task, pick open tasks, or skip. Render it only while it is open. With other
 * open tasks the list has the focus and its first task is highlighted: Enter or a click picks a task, Ctrl+Enter, Ctrl+click
 * or its checkbox selects several, the arrows move (up from the first task into the field) and typing goes to the field.
 */
export function NextStepPrompt({ taskTitle, candidates, onChoose, onCancel }: NextStepPromptProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const fieldId = `${useId()}-field`;
  const focusField = () => document.getElementById(fieldId)?.focus();
  const listId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    (list.current ?? dialog.querySelector<HTMLElement>('input[type="text"]'))?.focus();
    return () => dialog.close();
  }, []);

  const canContinue = title.trim() !== '' || picked.size > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() !== '') onChoose({ kind: 'new', title });
    else if (picked.size > 0) onChoose({ kind: 'pick', taskIds: [...picked] });
  }

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, listId]);

  /** Picks the task together with the selection and completes. */
  function pick(id: string) {
    onChoose({ kind: 'pick', taskIds: [...new Set([...picked, id])] });
  }

  function onListKeyDown(event: KeyboardEvent) {
    const n = candidates.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, n - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (active === 0) focusField();
      else setActive(active - 1);
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const task = candidates[active];
      if (!task) return;
      if (event.ctrlKey || event.metaKey) toggle(task.id, !picked.has(task.id));
      else pick(task.id);
    } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      // A character goes to the new-task field, which then replaces the selection.
      event.preventDefault();
      setTitle((current) => current + event.key);
      setPicked(new Set());
      focusField();
    }
  }

  function onRowClick(event: MouseEvent, id: string, index: number) {
    setActive(index);
    if (event.ctrlKey || event.metaKey) toggle(id, !picked.has(id));
    else pick(id);
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
          id={fieldId}
          value={title}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && candidates.length > 0) {
              event.preventDefault();
              setActive(0);
              list.current?.focus();
            }
          }}
          onChange={(event) => {
            setTitle(event.target.value);
            if (event.target.value !== '') setPicked(new Set());
          }}
        />
        {candidates.length > 0 && (
          <div className={styles.pick}>
            <span id={`${listId}-label`} className={styles.legend}>
              Or pick an open task
            </span>
            <div
              ref={list}
              role="listbox"
              aria-multiselectable="true"
              aria-labelledby={`${listId}-label`}
              aria-activedescendant={`${listId}-${active}`}
              tabIndex={0}
              className={styles.list}
              onKeyDown={onListKeyDown}
            >
              {candidates.map((task, index) => (
                <div
                  key={task.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={picked.has(task.id)}
                  data-active={index === active}
                  className={styles.row}
                  onMouseMove={() => setActive(index)}
                  onClick={(event) => onRowClick(event, task.id, index)}
                >
                  <label className={fieldStyles.toggle} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      aria-label={`Select ${task.title}`}
                      checked={picked.has(task.id)}
                      onChange={(event) => toggle(task.id, event.target.checked)}
                    />
                    <span className={fieldStyles.box} aria-hidden="true">
                      <Check />
                    </span>
                  </label>
                  <span className={styles.rowTitle}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
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
