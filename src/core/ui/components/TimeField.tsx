import { parseTime } from '../../dates/parse.ts';
import { ParsedTextField } from './ParsedTextField.tsx';

export interface TimeFieldProps {
  label: string;
  /** `HH:mm`, or null when empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Called with false while the typed text is not a valid time. */
  onValidity?: (valid: boolean) => void;
  error?: string | null;
}

/** A text field for a time as `HH:mm` (the browsers' native time inputs show neither our format nor a usable picker). */
export function TimeField({ label, value, onChange, onValidity, error }: TimeFieldProps) {
  return (
    <ParsedTextField
      label={label}
      value={value}
      format={(v) => v}
      parse={parseTime}
      placeholder="HH:mm"
      onChange={onChange}
      onValidity={onValidity}
      error={error}
    />
  );
}
