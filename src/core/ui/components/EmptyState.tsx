import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon: LucideIcon;
  /** One short line without a period. */
  text: string;
  /** The action that fills the section, usually a Button. */
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Icon className={styles.icon} aria-hidden="true" />
      <p className={styles.text}>{text}</p>
      {action}
    </div>
  );
}
