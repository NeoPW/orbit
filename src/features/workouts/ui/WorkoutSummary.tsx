import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { localToday } from '../../../core/dates/deadline.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { pathOf } from '../../../core/routing/routes.ts';
import { useRoute } from '../../../core/routing/useRoute.ts';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { getSession } from '../data/sessions-repository.ts';
import { clockTime, formatSet, pace, sessionMinutes } from '../domain/sessions.ts';
import styles from './WorkoutSummary.module.css';

const WorkoutSummaryContext = createContext<((sessionId: string) => void) | null>(null);

/** Opens the read-only summary of a workout session over the current screen. */
export function useOpenWorkoutSummary(): (sessionId: string) => void {
  const open = useContext(WorkoutSummaryContext);
  if (!open) throw new Error('useOpenWorkoutSummary() needs a WorkoutSummaryProvider');
  return open;
}

/** Holds the open workout summary and renders it next to the screen. Any navigation closes it. */
export function WorkoutSummaryProvider({ children }: { children: ReactNode }) {
  const path = pathOf(useRoute());
  const [opened, setOpened] = useState<{ id: string; path: string } | null>(null);
  const open = useCallback((id: string) => setOpened({ id, path: window.location.pathname + window.location.search }), []);
  const close = useCallback(() => setOpened(null), []);
  const shown = opened !== null && opened.path === path ? opened : null;
  return (
    <WorkoutSummaryContext.Provider value={open}>
      {children}
      {shown && <WorkoutSummary id={shown.id} onClose={close} />}
    </WorkoutSummaryContext.Provider>
  );
}

function WorkoutSummary({ id, onClose }: { id: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Wrapped, so that `undefined` means loading and `view: null` means the session is gone.
  const data = useLiveQuery(async (db) => ({ view: (await getSession(db, id)) ?? null }), [id]);
  const view = data?.view ?? null;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const session = view?.session;
  return (
    <dialog
      ref={ref}
      className={styles.popup}
      aria-label="Workout"
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop beside the panel.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{session?.name ?? 'Workout'}</h2>
        <IconButton label="Close" icon={<X />} tooltip="none" onClick={onClose} />
      </header>
      <div className={styles.body}>
        {data && !view && <p className={styles.muted}>Workout not found</p>}
        {session && view && (
          <>
            <p className={styles.muted}>
              {formatDate(localToday(new Date(session.startedAt)))} · {clockTime(session.startedAt)}–{clockTime(session.endedAt ?? session.startedAt)} ·{' '}
              {formatDuration(sessionMinutes(session.startedAt, session.endedAt ?? session.startedAt))}
            </p>
            {view.exercises.map((exercise) => (
              <section key={exercise.id} className={styles.exercise}>
                <h3 className={styles.exerciseName}>{exercise.name}</h3>
                {exercise.sets.length > 0 && (
                  <ol className={styles.sets}>
                    {exercise.sets.map((set) => (
                      <li key={set.id}>
                        {formatSet(exercise.kind, set, exercise.distanceUnit)}
                        {exercise.kind === 'endurance' && set.distance && set.durationSeconds
                          ? ` · ${pace(set.distance, set.durationSeconds, exercise.distanceUnit ?? 'km')}`
                          : ''}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </>
        )}
      </div>
    </dialog>
  );
}
