import { ArrowLeft, Square, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { getTimerView, type TimerView } from '../data/timer-view.ts';
import styles from './FocusMode.module.css';
import { TimerReadout } from './TimerReadout.tsx';
import { useStopTimer } from './useStopTimer.tsx';

/** Back to the previous screen; the timer keeps running. */
function leave() {
  if (window.history.length > 1) window.history.back();
  else navigate({ name: 'home' });
}

/** Full-window focus mode at `/focus`: only what the timer runs for, its notes, the timer, Stop and Discard. */
export function FocusMode() {
  const view = useLiveQuery(getTimerView, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Escape inside a dialog (stop, discard, next step) closes that dialog only.
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) leave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (view === undefined) return null;
  if (view === null) {
    return (
      <div className={styles.focus}>
        <EmptyState icon={Timer} text="No timer running" action={<Button onClick={() => navigate({ name: 'home' })}>Go to Home</Button>} />
      </div>
    );
  }
  return <FocusSession view={view} />;
}

function FocusSession({ view }: { view: TimerView }) {
  const ended = useCallback(() => leave(), []);
  const stop = useStopTimer(view, ended);
  const { timer } = view;
  return (
    <div className={styles.focus}>
      <Button variant="ghost" className={styles.leave} icon={<ArrowLeft />} onClick={leave}>
        Leave focus mode
      </Button>
      <div className={styles.target}>
        <h1>{view.title}</h1>
        {view.notes && <p className={styles.notes}>{view.notes}</p>}
      </div>
      <TimerReadout startedAt={timer.startedAt} plannedMinutes={timer.plannedMinutes} large />
      <div className={styles.actions}>
        <Button variant="primary" icon={<Square />} onClick={stop.askStop}>
          Stop
        </Button>
        <Button variant="ghost" icon={<Trash2 />} onClick={stop.askDiscard}>
          Discard
        </Button>
      </div>
      {stop.dialogs}
    </div>
  );
}
