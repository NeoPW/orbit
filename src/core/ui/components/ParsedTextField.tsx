import { useId, useState, type ReactNode } from 'react';
import type { ParseResult } from '../../dates/parse.ts';
import styles from './TextField.module.css';
import fieldStyles from './Field.module.css';

export interface ParsedTextFieldProps {
  label: string;
  /** The parsed value, or null when empty. */
  value: string | null;
  /** Text shown for a value. */
  format: (value: string) => string;
  parse: (text: string) => ParseResult;
  placeholder: string;
  /** Error from the form (for example "Required"); the field's own parse error takes precedence. */
  error?: string | null;
  /** Called with the parsed value as soon as the text is valid, and with null when the text is emptied. */
  onChange: (value: string | null) => void;
  /** Called with false while the text is not valid, so a form can disable Save. */
  onValidity?: (valid: boolean) => void;
  /** Placed inside the field on the right, for example the calendar button. */
  adornment?: ReactNode;
  id?: string;
}

/**
 * A text input for a typed value (date or time). Keeps what the user types,
 * shows the parse error after leaving the field or pressing Enter, and shows
 * the normalized text again after leaving it.
 */
export function ParsedTextField({ label, value, format, parse, placeholder, error, onChange, onValidity, adornment, id }: ParsedTextFieldProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const [text, setText] = useState(value ? format(value) : '');
  const [synced, setSynced] = useState(value);
  const [parseError, setParseError] = useState<string | null>(null);

  // The value was changed from outside (calendar, form reset): show it.
  if (value !== synced) {
    setSynced(value);
    setText(value ? format(value) : '');
    setParseError(null);
  }

  function check(next: string): ParseResult | null {
    return next.trim() === '' ? null : parse(next);
  }

  function handleChange(next: string) {
    setText(next);
    const result = check(next);
    if (result === null) {
      setParseError(null);
      setSynced(null);
      onValidity?.(true);
      onChange(null);
    } else if (result.ok) {
      setParseError(null);
      setSynced(result.value);
      onValidity?.(true);
      onChange(result.value);
    } else {
      onValidity?.(false);
    }
  }

  function showError() {
    const result = check(text);
    setParseError(result && !result.ok ? result.error : null);
  }

  const shownError = parseError ?? error ?? null;
  const errorId = `${fieldId}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <div className={fieldStyles.anchor}>
        <input
          id={fieldId}
          className={styles.control}
          value={text}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? errorId : undefined}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => {
            showError();
            if (value && check(text)?.ok) setText(format(value));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') showError();
          }}
        />
        {adornment}
      </div>
      {shownError && (
        <p id={errorId} className={styles.error}>
          {shownError}
        </p>
      )}
    </div>
  );
}
