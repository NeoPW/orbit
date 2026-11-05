import { useId, useState } from 'react';
import styles from './TextField.module.css';

export interface NumberFieldProps {
  label: string;
  /** The number, or null when empty or not a number. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Shown below the field and marks it invalid. Range checks belong to the form. */
  error?: string | null;
  placeholder?: string;
  /** Decimal keypad on touch devices; `numeric` (whole numbers) by default. */
  inputMode?: 'numeric' | 'decimal';
  id?: string;
}

function toNumber(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** A text field for a number (a comma counts as the decimal point); it keeps what the user typed until the value changes from outside. */
export function NumberField({ label, value, onChange, error, placeholder, inputMode = 'numeric', id }: NumberFieldProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const [text, setText] = useState(value === null ? '' : String(value));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setText(value === null ? '' : String(value));
  }
  const errorId = `${fieldId}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <input
        id={fieldId}
        className={styles.control}
        value={text}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const next = event.target.value;
          const parsed = toNumber(next);
          setText(next);
          setSynced(parsed);
          onChange(parsed);
        }}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
