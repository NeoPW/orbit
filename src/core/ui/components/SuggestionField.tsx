import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useOutsidePress, usePopoverPlacement } from './popover.ts';
import selectStyles from './Select.module.css';
import fieldStyles from './TextField.module.css';

export interface Suggestion {
  key: string;
  label: string;
  hint?: string | null;
  color?: string | null;
  /** Called when the suggestion is picked (click, tap, or Enter/Tab on it). */
  choose: () => void;
}

export interface SuggestionFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  /** Enter with no suggestion highlighted. Without it, that Enter is left to the surrounding form. */
  onSubmit?: () => void;
  error?: string | null;
}

/**
 * A text field with a popup of suggestions: the arrows move, a plain Enter or Tab picks, Escape closes. Shift+Enter is
 * left alone (it saves the form around the field). The popup is placed like the `Select` popup.
 */
export function SuggestionField({ label, value, onChange, suggestions, onSubmit, error }: SuggestionFieldProps) {
  const id = useId();
  const listId = `${id}-list`;
  const errorId = `${id}-error`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const anchor = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const shown = open && suggestions.length > 0;

  usePopoverPlacement(shown, anchor, popup);
  useOutsidePress(shown, [anchor, popup], () => setOpen(false));

  // The popup is at least as wide as the field.
  useEffect(() => {
    if (shown && popup.current && anchor.current) popup.current.style.minWidth = `${anchor.current.offsetWidth}px`;
  }, [shown]);

  function pick(index: number) {
    suggestions[index]?.choose();
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const n = suggestions.length;
      setActive(event.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
    } else if (event.key === 'Enter' && !event.shiftKey) {
      if (shown && active >= 0) {
        event.preventDefault();
        pick(active);
      } else if (onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    } else if (event.key === 'Tab' && !event.shiftKey && shown) {
      // Complete with the highlighted (else the first) suggestion; focus stays in the field.
      event.preventDefault();
      pick(active >= 0 ? active : 0);
    } else if (event.key === 'Escape' && shown) {
      // Stop the Escape reaching a Sheet around the field.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <div ref={anchor} className={selectStyles.anchor}>
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          className={fieldStyles.control}
          value={value}
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={shown ? listId : undefined}
          aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {shown && (
          <div ref={popup} id={listId} role="listbox" aria-label="Suggestions" className={selectStyles.popup}>
            {suggestions.map((s, index) => (
              <div
                key={s.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                data-active={index === active}
                className={selectStyles.option}
                // Keep focus in the input.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => pick(index)}
              >
                {s.color && <span className={selectStyles.dot} style={{ '--dot': s.color } as CSSProperties} aria-hidden="true" />}
                <span className={selectStyles.optionLabel}>{s.label}</span>
                {s.hint && <span className={selectStyles.hint}>{s.hint}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className={fieldStyles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
