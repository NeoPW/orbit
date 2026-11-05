import type { ReactNode } from 'react';
import fieldStyles from './Field.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Text beside the switch; also its accessible name. */
  label: ReactNode;
  disabled?: boolean;
}

/** An on/off switch (a checkbox with the switch role: Space toggles). */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={fieldStyles.toggle}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className={fieldStyles.track} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
