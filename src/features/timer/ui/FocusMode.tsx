import { ArrowLeft, CircleCheck, Pause, Play, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, type CSSProperties } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { useIsPhone } from '../../../core/ui/useIsPhone.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { getTimerView, type TimerView } from '../data/timer-view.ts';
import styles from './FocusMode.module.css';
import { TimerReadout } from './TimerReadout.tsx';
import { setTimerLimit } from '../data/timer-repository.ts';
import { TimeLimit } from './TimeLimit.tsx';
import { useSessionActions } from './useSessionActions.tsx';

/** Back to the previous screen; the timer keeps running. */
function leave() {
  if (window.history.length > 1) window.history.back();
  else navigate({ name: 'home' });
}

/** Full-window focus mode at `/focus`: only what the session runs for, its notes, the timer, the time limit, Pause or Resume, Complete and Discard (top right). */
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
      <div className={styles.empty}>
        <EmptyState icon={Timer} text="No timer running" action={<Button onClick={() => navigate({ name: 'home' })}>Go to Home</Button>} />
      </div>
    );
  }
  return <FocusSession view={view} />;
}

function FocusSession({ view }: { view: TimerView }) {
  const ended = useCallback(() => leave(), []);
  const actions = useSessionActions(view, ended);
  const { db } = useServices();
  const { timer } = view;
  const paused = timer.pausedAt !== null;
  const isPhone = useIsPhone();
  return (
    <div className={styles.focus} style={view.projectColor ? ({ '--pc': view.projectColor } as CSSProperties) : undefined}>
      <header className={styles.top}>
        <Button icon={<ArrowLeft />} onClick={leave}>
          {isPhone ? 'Back' : 'Leave focus mode (Esc)'}
        </Button>
        <IconButton label="Discard" icon={<Trash2 />} onClick={actions.askDiscard} />
      </header>
      <main className={styles.main}>
        <div className={styles.column}>
          {view.projectColor && view.projectName && <Chip projectColor={view.projectColor}>{view.projectName}</Chip>}
          <h1>{view.title}</h1>
          <TimerReadout session={timer} limitMinutes={timer.plannedMinutes} large />
          <div className={styles.actions}>
            {paused ? (
              <Button variant="primary" icon={<Play />} onClick={actions.resume}>
                Resume
              </Button>
            ) : (
              <Button variant="primary" icon={<Pause />} onClick={actions.pause}>
                Pause
              </Button>
            )}
            <Button icon={<CircleCheck />} onClick={actions.askComplete}>
              Complete
            </Button>
          </div>
          <div className={styles.limit}>
            <TimeLimit minutes={timer.plannedMinutes} onChange={(minutes) => void setTimerLimit(db, () => new Date(), minutes)} />
          </div>
          {view.notes && (
            <section className={styles.notes} aria-label="Notes">
              <h2>Notes</h2>
              <p>{view.notes}</p>
            </section>
          )}
        </div>
      </main>
      {actions.dialogs}
    </div>
  );
}
