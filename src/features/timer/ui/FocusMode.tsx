import { ArrowLeft, Square, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, type CSSProperties } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ThemeSwitcher } from '../../../core/ui/components/ThemeSwitcher.tsx';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { useSettings } from '../../settings/data/settings.ts';
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
      <div className={styles.empty}>
        <EmptyState icon={Timer} text="No timer running" action={<Button onClick={() => navigate({ name: 'home' })}>Go to Home</Button>} />
      </div>
    );
  }
  return <FocusSession view={view} />;
}

function FocusSession({ view }: { view: TimerView }) {
  const ended = useCallback(() => leave(), []);
  const stop = useStopTimer(view, ended);
  const { settings, save } = useSettings();
  const { timer } = view;
  return (
    <div className={styles.focus} style={view.projectColor ? ({ '--pc': view.projectColor } as CSSProperties) : undefined}>
      <header className={styles.top}>
        <Button icon={<ArrowLeft />} onClick={leave}>
          Leave focus mode (Esc)
        </Button>
        <ThemeSwitcher value={settings.theme} onChange={(id) => void save('theme', id)} />
      </header>
      <main className={styles.main}>
        <div className={styles.column}>
          {view.projectColor && view.projectName && <Chip projectColor={view.projectColor}>{view.projectName}</Chip>}
          <h1>{view.title}</h1>
          <TimerReadout startedAt={timer.startedAt} plannedMinutes={timer.plannedMinutes} large />
          <div className={styles.actions}>
            <Button variant="primary" icon={<Square />} onClick={stop.askStop}>
              Stop
            </Button>
            <Button icon={<Trash2 />} onClick={stop.askDiscard}>
              Discard
            </Button>
          </div>
          {view.notes && (
            <section className={styles.notes} aria-label="Notes">
              <h2>Notes</h2>
              <p>{view.notes}</p>
            </section>
          )}
        </div>
      </main>
      {stop.dialogs}
    </div>
  );
}
