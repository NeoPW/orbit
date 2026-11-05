import { useId } from 'react';
import styles from './TextField.module.css';
import fieldStyles from './Field.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  group: string;
  options: SelectOption[];
}

export interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Options, or option groups; an option with value "" can stand for "none". */
  options: (SelectOption | SelectGroup)[];
  error?: string | null;
  id?: string;
}

function renderOption(option: SelectOption) {
  return (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
}

/** A native select (keyboard and screen readers for free), with optional option groups. */
export function Select({ label, value, onChange, options, error, id }: SelectProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const errorId = `${fieldId}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <select
        id={fieldId}
        className={`${styles.control} ${fieldStyles.select}`}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((item) =>
          'group' in item ? (
            <optgroup key={item.group} label={item.group}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item)
          ),
        )}
      </select>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
