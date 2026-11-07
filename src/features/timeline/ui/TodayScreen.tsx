import { ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react';
import { useRef, useState, type TouchEvent } from 'react';
import { addDays, useNow, useToday } from '../../../core/dates/today.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { LogWorkSheet } from '../../work-log/ui/LogWorkSheet.tsx';
import { loadTimeline } from '../data/timeline-loader.ts';
import { localRange, shiftDay } from '../domain/day-timeline.ts';
import { DayTimeline } from './DayTimeline.tsx';
import styles from './TodayScreen.module.css';

/** A swipe counts when it moves this far sideways and clearly more sideways than up or down. */
const SWIPE_PX = 60;

function weekday(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });
}

/** The phone's Today screen: the timeline of one day, today first, with previous/next day and swipe. */
export function TodayScreen() {
  const today = useToday();
  const now = useNow(60000);
  const [chosen, setChosen] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  // Never later than today, also after midnight passes while a past day is shown.
  const day = chosen && chosen < today ? chosen : today;
  const isToday = day === today;

  const items = useLiveQuery(
    (db) => {
      const { from, to } = localRange(day, addDays(day, 1));
      return loadTimeline(db, from, to);
    },
    [day],
  );

  const go = (delta: number) => setChosen(shiftDay(day, delta, today));

  // Touch events, not pointer events: the browser cancels the pointer once it treats the move as a pan,
  // but `touchend` still reports where the finger left.
  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    start.current = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: TouchEvent) {
    const from = start.current;
    const touch = event.changedTouches[0];
    start.current = null;
    if (!from || !touch) return;
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < 2 * Math.abs(dy)) return;
    // Swiping right shows the previous day, swiping left the next one.
    go(dx > 0 ? -1 : 1);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Previous day" tooltip="none" icon={<ChevronLeft />} onClick={() => go(-1)} />
        <h1 className={styles.title}>
          <span>{isToday ? 'Today' : weekday(day)}</span>
          <span className={styles.date}>
            {isToday && `${weekday(day)} `}
            {formatDate(day)}
          </span>
        </h1>
        <IconButton label="Next day" tooltip="none" icon={<ChevronRight />} disabled={isToday} onClick={() => go(1)} />
      </header>
      <div
        className={styles.swipe}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => (start.current = null)}
      >
        <DayTimeline
          days={[{ date: day, items: items ?? [] }]}
          now={now}
          today={today}
          hourHeight={48}
          label={isToday ? 'Work today' : `Work on ${weekday(day)} ${formatDate(day)}`}
          emptyText="Nothing logged"
          emptyAction={
            isToday ? (
              <Button icon={<NotebookPen />} onClick={() => setLogging(true)}>
                Log work
              </Button>
            ) : undefined
          }
        />
      </div>
      {logging && <LogWorkSheet onClose={() => setLogging(false)} />}
    </div>
  );
}
