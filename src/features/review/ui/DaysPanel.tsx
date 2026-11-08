import { Section } from '../../../core/ui/components/Section.tsx';
import { WeekTimeline } from '../../timeline/ui/WeekTimeline.tsx';

/** Height of the day timelines in the dashboard; the rest of the day scrolls. */
const DAYS_HEIGHT = 380;

/** "Days": the seven day timelines of the week, each headed with the hours worked that day. */
export function DaysPanel({ weekStart, dayMinutes }: { weekStart: string; dayMinutes: number[] }) {
  return (
    <Section tile title="Days">
      <WeekTimeline weekStart={weekStart} dayMinutes={dayMinutes} maxHeight={DAYS_HEIGHT} />
    </Section>
  );
}
