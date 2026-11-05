import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';
import { formatDate } from '../../dates/format.ts';
import { parseDate } from '../../dates/parse.ts';
import { addDays, useToday } from '../../dates/today.ts';
import { IconButton } from './Button.tsx';
import { ParsedTextField } from './ParsedTextField.tsx';
import { useOutsidePress, usePopoverPlacement } from './popover.ts';
import fieldStyles from './Field.module.css';

export interface DateFieldProps {
  label: string;
  /** `yyyy-mm-dd`, or null when empty. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Called with false while the typed text is not a valid date. */
  onValidity?: (valid: boolean) => void;
  error?: string | null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** First day of the month of `date`, and the same month moved by `months`, as `yyyy-mm-01`. */
function monthStart(date: string, months = 0): string {
  const [y, m] = date.split('-').map(Number) as [number, number];
  const index = y * 12 + (m - 1) + months;
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}-01`;
}

/** The 6 weeks (Monday first) that show the month starting at `first`. */
function monthGrid(first: string): string[] {
  const [y, m] = first.split('-').map(Number) as [number, number];
  const weekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // 0 = Monday
  const start = addDays(first, -weekday);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function Calendar({ value, onPick, onClose, anchor }: { value: string | null; onPick: (date: string) => void; onClose: () => void; anchor: RefObject<HTMLElement | null> }) {
  const today = useToday();
  const [shown, setShown] = useState(() => monthStart(value ?? today));
  const popup = useRef<HTMLDivElement>(null);
  usePopoverPlacement(true, anchor, popup);
  useOutsidePress(true, [popup, anchor], onClose);
  const [year, month] = shown.split('-').map(Number) as [number, number];

  return (
    <div
      ref={popup}
      className={fieldStyles.calendar}
      role="dialog"
      aria-label="Calendar"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <div className={fieldStyles.calendarHead}>
        <IconButton label="Previous month" icon={<ChevronLeft />} tooltip="none" onClick={() => setShown(monthStart(shown, -1))} />
        <span aria-live="polite">
          {MONTHS[month - 1]} {year}
        </span>
        <IconButton label="Next month" icon={<ChevronRight />} tooltip="none" onClick={() => setShown(monthStart(shown, 1))} />
      </div>
      <div className={fieldStyles.grid}>
        {WEEKDAYS.map((name) => (
          <span key={name} className={fieldStyles.weekday} aria-hidden="true">
            {name}
          </span>
        ))}
        {monthGrid(shown).map((date) => {
          const inMonth = date.slice(0, 7) === shown.slice(0, 7);
          return (
            <button
              key={date}
              type="button"
              className={fieldStyles.day}
              style={inMonth ? undefined : { opacity: 0.4 }}
              data-today={date === today}
              aria-pressed={date === value}
              aria-label={formatDate(date)}
              onClick={() => onPick(date)}
            >
              {Number(date.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A text field for a date as `dd-mm-yyyy` with a small calendar to pick from. */
export function DateField({ label, value, onChange, onValidity, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);

  return (
    <ParsedTextField
        label={label}
        value={value}
        format={formatDate}
        parse={parseDate}
        placeholder="dd-mm-yyyy"
        onChange={onChange}
        onValidity={onValidity}
        error={error}
        adornment={
          <span ref={anchor} className={fieldStyles.anchorButton}>
            <IconButton label="Pick from calendar" icon={<CalendarDays />} tooltip="none" onClick={() => setOpen(!open)} aria-expanded={open} />
            {open && (
              <Calendar
                anchor={anchor}
                value={value}
                onClose={() => setOpen(false)}
                onPick={(date) => {
                  onValidity?.(true);
                  onChange(date);
                  setOpen(false);
                }}
              />
            )}
          </span>
        }
    />
  );
}
