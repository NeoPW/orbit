import { CalendarClock, CircleAlert, Flag } from 'lucide-react';
import { deadlineBadge } from '../../dates/deadline.ts';
import { useToday } from '../../dates/today.ts';
import { useSettings } from '../../../features/settings/data/settings.ts';
import { Chip } from './Chip.tsx';

export interface DeadlineBadgeProps {
  /** `yyyy-mm-dd`. */
  deadline: string;
  /** `yyyy-mm-dd`; the local date by default. */
  today?: string;
  /** Days ahead from which the badge turns amber; the lead time setting by default. */
  leadDays?: number;
  /** Marks a deadline taken from the goal (flag icon). */
  inherited?: boolean;
}

export function DeadlineBadge({ deadline, today, leadDays, inherited = false }: DeadlineBadgeProps) {
  const localToday = useToday();
  const { settings } = useSettings();
  const { label, tone } = deadlineBadge(deadline, today ?? localToday, leadDays ?? settings.leadDays);
  const chipTone = tone === 'overdue' ? 'red' : tone === 'soon' ? 'amber' : 'neutral';
  const Icon = tone === 'overdue' ? CircleAlert : inherited ? Flag : CalendarClock;
  return (
    <Chip tone={chipTone} icon={<Icon aria-hidden="true" />} title={inherited ? 'Deadline of the goal' : 'Deadline'}>
      {label}
      {inherited && <span className="visually-hidden">, from the goal</span>}
    </Chip>
  );
}
