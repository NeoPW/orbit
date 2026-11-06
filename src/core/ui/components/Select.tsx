import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useOutsidePress, usePopoverPlacement } from './popover.ts';
import styles from './TextField.module.css';
import selectStyles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** A CSS colour for a dot before the label, for example a project colour. */
  color?: string;
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

const TYPE_AHEAD_MS = 700;

function Dot({ color }: { color?: string }) {
  return color ? <span className={selectStyles.dot} style={{ '--dot': color } as CSSProperties} aria-hidden="true" /> : null;
}

/**
 * A styled dropdown: a button showing the chosen value and a popup list with
 * optional groups and colour dots. Arrow keys, Enter, Space, Escape, type-ahead
 * and a click outside work as in a native select. The popup is rendered next to
 * the button (not in a portal), so it also works inside a Sheet.
 */
export function Select({ label, value, onChange, options, error, id }: SelectProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const errorId = `${fieldId}-error`;
  const listId = `${fieldId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const flat = options.flatMap((item) => ('group' in item ? item.options : [item]));
  const selected = flat.find((option) => option.value === value);
  const enabled = (index: number) => !flat[index]?.disabled;

  usePopoverPlacement(open, anchor, popup);
  useOutsidePress(open, [anchor, popup], () => setOpen(false));

  // Keep the active option in view.
  useEffect(() => {
    if (open) popup.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  // The popup is at least as wide as the button.
  useEffect(() => {
    if (open && popup.current && anchor.current) popup.current.style.minWidth = `${anchor.current.offsetWidth}px`;
  }, [open]);

  function step(from: number, direction: 1 | -1): number {
    for (let i = 1; i <= flat.length; i++) {
      const index = (from + direction * i + flat.length * i) % flat.length;
      if (enabled(index)) return index;
    }
    return from;
  }

  function openAt(index: number) {
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = flat[index];
    if (!option || option.disabled) return;
    setOpen(false);
    button.current?.focus();
    if (option.value !== value) onChange(option.value);
  }

  function typeAhead(char: string, now: number): boolean {
    const state = typed.current;
    state.text = now - state.at > TYPE_AHEAD_MS ? char : state.text + char;
    state.at = now;
    const from = open ? active : flat.findIndex((o) => o.value === value);
    const text = state.text.toLowerCase();
    // A repeated letter cycles; a longer word narrows the match.
    const order = flat.map((_, i) => (from + (text.length === 1 ? 1 : 0) + i) % flat.length);
    const found = order.find((i) => enabled(i) && flat[i]?.label.toLowerCase().startsWith(text));
    if (found === undefined) return true;
    openAt(found);
    return true;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (flat.length === 0) return;
    const current = Math.max(
      0,
      flat.findIndex((o) => o.value === value),
    );
    const key = event.key;
    if (key === 'Escape') {
      if (!open) return;
      // Stop the Escape reaching a Sheet around the dropdown.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const direction = key === 'ArrowDown' ? 1 : -1;
      openAt(step(open ? active : current, direction));
    } else if (key === 'Home' || key === 'End') {
      if (!open) return;
      event.preventDefault();
      setActive(key === 'Home' ? step(-1, 1) : step(flat.length, -1));
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else openAt(enabled(current) ? current : step(current, 1));
    } else if (key === 'Tab') {
      setOpen(false);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      typeAhead(key, event.timeStamp);
    }
  }

  const renderOption = (option: SelectOption) => {
    const at = flat.indexOf(option);
    return (
      <div
        key={`${option.value}-${at}`}
        id={`${listId}-${at}`}
        role="option"
        aria-selected={option.value === value}
        aria-disabled={option.disabled || undefined}
        data-active={at === active}
        className={selectStyles.option}
        // Keep focus on the button.
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => !option.disabled && setActive(at)}
        onClick={() => choose(at)}
      >
        <Dot color={option.color} />
        <span className={selectStyles.optionLabel}>{option.label}</span>
        {option.value === value && <span aria-hidden="true">✓</span>}
      </div>
    );
  };

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <div ref={anchor} className={selectStyles.anchor}>
        <button
          ref={button}
          id={fieldId}
          type="button"
          role="combobox"
          className={`${styles.control} ${selectStyles.button}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={() => (open ? setOpen(false) : openAt(Math.max(0, flat.findIndex((o) => o.value === value))))}
          onKeyDown={onKeyDown}
        >
          <Dot color={selected?.color} />
          <span className={selectStyles.value}>{selected?.label ?? ''}</span>
          <ChevronDown className={selectStyles.chevron} aria-hidden="true" />
        </button>
        {open && (
          <div ref={popup} id={listId} role="listbox" aria-label={label} className={selectStyles.popup}>
            {options.map((item) =>
              'group' in item ? (
                <div key={item.group} role="group" aria-label={item.group}>
                  <div className={selectStyles.groupLabel} aria-hidden="true">
                    {item.group}
                  </div>
                  {item.options.map(renderOption)}
                </div>
              ) : (
                renderOption(item)
              ),
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
