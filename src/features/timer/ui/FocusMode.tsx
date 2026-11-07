import { ArrowLeft, CircleCheck, Pause, Play, Timer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { useScreenShortcuts } from '../../../app/shortcuts/screen-keys.ts';
import { withShortcut } from '../../../app/shortcuts/keys.ts';
import { focusModeRequest } from '../../../app/shortcuts/requests.ts';
import { stepLimit, workedMs } from '../domain/timer.ts';
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

  if (view === undefined) return null;
  if (view === null) {
    return (
      <div className={styles.empty}>
        <LeaveOnEscape />
        <EmptyState icon={Timer} text="No timer running" action={<Button onClick={() => navigate({ name: 'home' })}>Go to Home</Button>} />
      </div>
    );
  }
  return <FocusSession view={view} />;
}

/** Without a session only Esc does something. */
function LeaveOnEscape() {
  useScreenShortcuts((match) => {
    if (match.action === 'focus-leave') leave();
  });
  return null;
}

function FocusSession({ view }: { view: TimerView }) {
  const ended = useCallback(() => leave(), []);
  const actions = useSessionActions(view, ended);
  const { db } = useServices();
  const { timer } = view;
  const paused = timer.pausedAt !== null;
  const isPhone = useIsPhone();
  const openLimit = useRef<(() => void) | null>(null);
  const setOpener = useCallback((open: () => void) => {
    openLimit.current = open;
  }, []);
  const setLimit = (minutes: number | null) => void setTimerLimit(db, () => new Date(), minutes);

  // Esc, Space, Enter, Delete, L, + and − (see openspec keyboard-shortcuts, "Focus mode keys"); a dialog closes first,
  // as no shortcut fires while one is open.
  useScreenShortcuts((match) => {
    if (match.action === 'focus-leave') leave();
    else if (match.action === 'focus-toggle') (paused ? actions.resume : actions.pause)();
    else if (match.action === 'focus-complete') actions.askComplete();
    else if (match.action === 'focus-discard') actions.askDiscard();
    else if (match.action === 'focus-limit') openLimit.current?.();
    else if (match.action === 'focus-limit-up' || match.action === 'focus-limit-down') {
      setLimit(stepLimit(timer.plannedMinutes, workedMs(timer, new Date()), match.action === 'focus-limit-up' ? 5 : -5));
    }
  });

  // "Complete" and "Set time limit" from the command palette.
  useEffect(
    () =>
      focusModeRequest.subscribe((what) => {
        if (what === 'complete') actions.askComplete();
        else openLimit.current?.();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <div className={styles.focus} style={view.projectColor ? ({ '--pc': view.projectColor } as CSSProperties) : undefined}>
      <header className={styles.top}>
        <Button icon={<ArrowLeft />} onClick={leave}>
          {isPhone ? 'Back' : 'Leave focus mode (Esc)'}
        </Button>
        <IconButton label={withShortcut('Discard', 'focus-discard')} icon={<Trash2 />} onClick={actions.askDiscard} />
      </header>
      <main className={styles.main}>
        <div className={styles.column}>
          {view.projectColor && view.projectName && <Chip projectColor={view.projectColor}>{view.projectName}</Chip>}
          <h1>{view.title}</h1>
          <TimerReadout session={timer} limitMinutes={timer.plannedMinutes} large />
          <div className={styles.actions}>
            {paused ? (
              <Button variant="primary" icon={<Play />} onClick={actions.resume} title={withShortcut('Resume', 'focus-toggle')}>
                Resume
              </Button>
            ) : (
              <Button variant="primary" icon={<Pause />} onClick={actions.pause} title={withShortcut('Pause', 'focus-toggle')}>
                Pause
              </Button>
            )}
            <Button icon={<CircleCheck />} onClick={actions.askComplete} title={withShortcut('Complete', 'focus-complete')}>
              Complete
            </Button>
          </div>
          <div className={styles.limit}>
            <TimeLimit minutes={timer.plannedMinutes} onChange={setLimit} onOpener={setOpener} />
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
