import type { ReactNode } from 'react';
import styles from './ListRow.module.css';

export interface ListRowProps {
  /** Before the title: a checkbox, color dot or icon. */
  leading?: ReactNode;
  title: ReactNode;
  /** Below the title: chips, badges, a progress bar. */
  meta?: ReactNode;
  /** After the text: controls and icon buttons (not part of the row's own button). */
  trailing?: ReactNode;
  /** Makes the title and meta area a button that opens the item. */
  onOpen?: () => void;
  /** Draws the row faded, for example a completed task. */
  muted?: boolean;
}

/** One row of a list: leading control, title with meta below, trailing controls. */
export function ListRow({ leading, title, meta, trailing, onOpen, muted = false }: ListRowProps) {
  const text = (
    <>
      <span className={styles.title}>{title}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </>
  );
  return (
    <div className={`${styles.row} ${muted ? styles.muted : ''}`}>
      {leading && <div className={styles.leading}>{leading}</div>}
      {onOpen ? (
        <button type="button" className={`${styles.text} ${styles.open}`} onClick={onOpen}>
          {text}
        </button>
      ) : (
        <div className={styles.text}>{text}</div>
      )}
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </div>
  );
}
