import { X } from 'lucide-react';
import { useId, useLayoutEffect, useRef } from 'react';
import { IconButton } from '../../core/ui/components/Button.tsx';
import { SHORTCUTS, type Shortcut } from './keys.ts';
import styles from './ShortcutOverlay.module.css';

const GROUPS: Shortcut['group'][] = ['Global', 'To do list', 'Focus mode'];

/** Every shortcut with its key, grouped; `?` or Esc closes it. Render it only while it is open. */
export function ShortcutOverlay({ onClose }: { onClose: () => void }) {
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
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === '?') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <header className={styles.head}>
        <h2 id={titleId}>Keyboard shortcuts</h2>
        <IconButton label="Close" icon={<X />} onClick={onClose} autoFocus />
      </header>
      <div className={styles.groups}>
        {GROUPS.map((group) => (
          <section key={group} aria-label={group}>
            <h3>{group}</h3>
            <dl>
              {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                <div key={s.action} className={styles.row}>
                  <dt>{s.label}</dt>
                  <dd>
                    <kbd>{s.keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </dialog>
  );
}
