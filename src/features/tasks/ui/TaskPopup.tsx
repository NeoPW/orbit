import { ExternalLink, X } from 'lucide-react';
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { pathOf } from '../../../core/routing/routes.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import styles from './TaskPopup.module.css';
import { TaskDetails } from './TaskDetails.tsx';

const TaskPopupContext = createContext<((id: string) => void) | null>(null);

/** Opens a task in the popup over the current screen. */
export function useOpenTask(): (id: string) => void {
  const open = useContext(TaskPopupContext);
  if (!open) throw new Error('useOpenTask() needs a TaskPopupProvider');
  return open;
}

/** Holds the open task popup and renders it next to the screen. Any navigation closes it. */
export function TaskPopupProvider({ children }: { children: ReactNode }) {
  const path = pathOf(useRoute());
  // The popup belongs to the screen it was opened on: another address closes it without an effect.
  const [opened, setOpened] = useState<{ id: string; path: string } | null>(null);
  const open = useCallback((id: string) => setOpened({ id, path: window.location.pathname + window.location.search }), []);
  const close = useCallback(() => setOpened(null), []);
  const shown = opened !== null && opened.path === path ? opened : null;
  return (
    <TaskPopupContext.Provider value={open}>
      {children}
      {shown && <TaskPopup id={shown.id} onClose={close} />}
    </TaskPopupContext.Provider>
  );
}

function TaskPopup({ id, onClose }: { id: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.popup}
      aria-label="Task"
      onCancel={(event) => {
        // React bubbles a nested sheet's or dialog's cancel up to here; only the topmost layer closes.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop beside the panel.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <Button icon={<ExternalLink />} onClick={() => navigate({ name: 'task', id })}>
            Open page
          </Button>
          <IconButton label="Close" icon={<X />} tooltip="none" onClick={onClose} />
        </header>
        <div className={styles.body}>
          <TaskDetails id={id} missing={<p className={styles.missing}>Task not found</p>} onDeleted={onClose} />
        </div>
      </div>
    </dialog>
  );
}
