import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useSyncExternalStore, type FocusEvent } from 'react';
import { useMessages } from './MessageProvider.tsx';
import styles from './MessageHost.module.css';

/** Shows the current message at the top of the window. Mounted once, in the shell. */
export function MessageHost() {
  const messenger = useMessages();
  const message = useSyncExternalStore(messenger.subscribe, messenger.current);

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) messenger.resume();
  }

  // The live region stays mounted so screen readers announce each new message.
  return (
    <div className={styles.host} role="status" aria-live="polite">
      {message && (
        <div
          key={message.id}
          className={`${styles.card} ${styles[message.kind]}`}
          onPointerEnter={messenger.pause}
          onPointerLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) messenger.resume();
          }}
          onFocus={messenger.pause}
          onBlur={onBlur}
        >
          {message.kind === 'success' && <CircleCheck className={styles.icon} aria-hidden="true" />}
          {message.kind === 'info' && <Info className={styles.icon} aria-hidden="true" />}
          {message.kind === 'error' && <CircleAlert className={styles.icon} aria-hidden="true" />}
          <span className={styles.text}>{message.text}</span>
          {message.action && (
            <button type="button" className={styles.action} onClick={messenger.runAction}>
              {message.action.label}
            </button>
          )}
          <button type="button" className={styles.close} aria-label="Close message" onClick={messenger.dismiss}>
            <X aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
