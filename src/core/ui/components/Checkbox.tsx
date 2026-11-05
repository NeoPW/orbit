import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import fieldStyles from './Field.module.css';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Text beside the box; also its accessible name. */
  label: ReactNode;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={fieldStyles.toggle}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className={fieldStyles.box} aria-hidden="true">
        <Check />
      </span>
      <span>{label}</span>
    </label>
  );
}
