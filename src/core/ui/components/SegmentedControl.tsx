import { useRef, type KeyboardEvent } from 'react';
import fieldStyles from './Field.module.css';

export interface Segment<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  /** Accessible name of the group. */
  label: string;
  options: Segment<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** One choice out of a few, as a row of buttons (a radio group: arrow keys move and choose). */
export function SegmentedControl<T extends string | number>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const current = Math.max(0, options.findIndex((option) => option.value === value));
    const next = options[(current + step + options.length) % options.length];
    if (!next) return;
    onChange(next.value);
    const buttons = group.current?.querySelectorAll<HTMLElement>('[role="radio"]');
    buttons?.[options.indexOf(next)]?.focus();
  }

  const tabbable = options.some((option) => option.value === value) ? value : options[0]?.value;
  return (
    <div ref={group} className={fieldStyles.segments} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === tabbable ? 0 : -1}
          className={fieldStyles.segment}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
