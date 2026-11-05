import type { CSSProperties } from 'react';
import fieldStyles from './Field.module.css';

export interface ColorPickerProps {
  /** Accessible name of the group. */
  label: string;
  colors: readonly string[];
  /** The chosen color, or null for Auto. A color outside `colors` (an older choice) is shown too. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Adds an "Auto" choice that gives null. */
  allowAuto?: boolean;
}

/** Color swatches, optionally with "Auto". */
export function ColorPicker({ label, colors, value, onChange, allowAuto = false }: ColorPickerProps) {
  const shown = value !== null && !colors.includes(value) ? [...colors, value] : colors;
  return (
    <div className={fieldStyles.swatches} role="radiogroup" aria-label={label}>
      {allowAuto && (
        <button type="button" role="radio" aria-checked={value === null} className={fieldStyles.auto} onClick={() => onChange(null)}>
          Auto
        </button>
      )}
      {shown.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={color}
          title={color}
          className={fieldStyles.swatch}
          style={{ '--swatch-color': color } as CSSProperties}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
