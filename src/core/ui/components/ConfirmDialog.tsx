import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from './Button.tsx';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  title: string;
  /** One or two sentences on what happens. */
  text: string;
  confirmLabel: string;
  /** Destructive actions (delete, replace data) get the danger style. */
  danger?: boolean;
  onConfirm: () => void;
  /** Cancel, also by Escape. */
  onCancel: () => void;
}

/** Asks before an action. Render it only while it is open. */
export function ConfirmDialog({ title, text, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

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
      <h2 id={titleId}>{title}</h2>
      <p className={styles.text}>{text}</p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} autoFocus>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
