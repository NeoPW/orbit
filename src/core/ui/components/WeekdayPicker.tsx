import fieldStyles from './Field.module.css';

export interface WeekdayPickerProps {
  /** Selected ISO weekdays: 1 = Monday … 7 = Sunday. */
  value: number[];
  onChange: (value: number[]) => void;
}

const DAYS = [
  { day: 1, short: 'Mon', name: 'Monday' },
  { day: 2, short: 'Tue', name: 'Tuesday' },
  { day: 3, short: 'Wed', name: 'Wednesday' },
  { day: 4, short: 'Thu', name: 'Thursday' },
  { day: 5, short: 'Fri', name: 'Friday' },
  { day: 6, short: 'Sat', name: 'Saturday' },
  { day: 7, short: 'Sun', name: 'Sunday' },
];

/** Toggles for the days of the week (any number selected); the result is sorted. */
export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  function toggle(day: number) {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next.sort((a, b) => a - b));
  }
  return (
    <div className={fieldStyles.segments} role="group" aria-label="Weekdays">
      {DAYS.map(({ day, short, name }) => (
        <button key={day} type="button" className={fieldStyles.segment} aria-pressed={value.includes(day)} aria-label={name} onClick={() => toggle(day)}>
          {short}
        </button>
      ))}
    </div>
  );
}
