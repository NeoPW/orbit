import type { CSSProperties } from 'react';
import fieldStyles from './Field.module.css';

export interface ColorPickerProps {
  /** Accessible name of the group. */
  label: string;
  /** CSS colours (hex or `var(--pc0)`), used as the swatch background. */
  colors: readonly string[];
  /** The chosen color, or null for Auto. A color outside `colors` (an older choice) is shown too. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Adds an "Auto" choice that gives null. */
  allowAuto?: boolean;
  /** Accessible name of a swatch; the colour value itself by default. */
  colorLabel?: (color: string) => string;
}

/** Color swatches, optionally with "Auto". */
export function ColorPicker({ label, colors, value, onChange, allowAuto = false, colorLabel = (color) => color }: ColorPickerProps) {
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
          aria-label={colorLabel(color)}
          title={colorLabel(color)}
          className={fieldStyles.swatch}
          style={{ '--swatch-color': color } as CSSProperties}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
