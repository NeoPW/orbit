import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Button, IconButton } from './Button.tsx';
import styles from './Sheet.module.css';

export interface SheetProps {
  title: string;
  /** Closing without saving: the close button, Escape or a click beside the sheet. The changes are discarded. */
  onClose: () => void;
  /** Save, also by Enter in a single-line field. The caller closes the sheet when saving succeeded. */
  onSave: () => void;
  /** Shown only when editing. */
  onDelete?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: ReactNode;
}

/**
 * A form in a side sheet. Render it only while it is open: unmounting drops
 * the children's state, so closing without saving discards the changes.
 */
export function Sheet({ title, onClose, onSave, onDelete, saveLabel = 'Save', saveDisabled = false, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    // showModal() focuses the first focusable element (the close button); a form starts in its first field.
    dialog.querySelector<HTMLElement>(`.${styles.body} :is(input, textarea, select)`)?.focus();
    return () => dialog.close();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!saveDisabled) onSave();
  }

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop beside the panel.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className={styles.panel} onSubmit={submit} noValidate>
        <header className={styles.header}>
          <h2>{title}</h2>
          <IconButton label="Close" icon={<X />} tooltip="none" onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={saveDisabled} className={styles.save}>
            {saveLabel}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}
