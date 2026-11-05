import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './TextField.module.css';

interface FieldProps {
  label: string;
  /** Shown below the field and marks it invalid. */
  error?: string | null;
}

export type TextFieldProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, id, className, ...rest }: TextFieldProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const errorId = `${fieldId}-error`;
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <input
        id={fieldId}
        className={styles.control}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export type TextAreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ label, error, id, className, rows = 4, ...rest }: TextAreaProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const errorId = `${fieldId}-error`;
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={`${styles.control} ${styles.multiline}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
