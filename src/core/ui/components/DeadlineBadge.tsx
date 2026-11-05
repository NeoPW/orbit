import { CalendarClock, CircleAlert, Flag } from 'lucide-react';
import { DEFAULT_LEAD_DAYS, deadlineBadge, localToday } from '../../dates/deadline.ts';
import { Chip } from './Chip.tsx';

export interface DeadlineBadgeProps {
  /** `yyyy-mm-dd`. */
  deadline: string;
  /** `yyyy-mm-dd`; the local date by default. */
  today?: string;
  leadDays?: number;
  /** Marks a deadline taken from the goal (flag icon). */
  inherited?: boolean;
}

export function DeadlineBadge({ deadline, today = localToday(), leadDays = DEFAULT_LEAD_DAYS, inherited = false }: DeadlineBadgeProps) {
  const { label, tone } = deadlineBadge(deadline, today, leadDays);
  const chipTone = tone === 'overdue' ? 'red' : tone === 'soon' ? 'amber' : 'neutral';
  const Icon = tone === 'overdue' ? CircleAlert : inherited ? Flag : CalendarClock;
  return (
    <Chip tone={chipTone} icon={<Icon aria-hidden="true" />} title={inherited ? 'Deadline of the goal' : 'Deadline'}>
      {label}
      {inherited && <span className="visually-hidden">, from the goal</span>}
    </Chip>
  );
}
