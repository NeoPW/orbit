import { Dumbbell, History, ListChecks, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useNow } from '../../../core/dates/today.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { listExercises, type Exercise } from '../data/exercises-repository.ts';
import { getRunningSession, listRecentSessions, startSession, type WorkoutSession } from '../data/sessions-repository.ts';
import { listWorkouts, type WorkoutView } from '../data/workouts-repository.ts';
import { clockTime, runningMinutes, sessionMinutes } from '../domain/sessions.ts';
import { ExerciseSheet, KIND_OPTIONS } from './ExerciseSheet.tsx';
import { WorkoutSheet } from './WorkoutSheet.tsx';
import styles from './WorkoutsScreen.module.css';

const clock = () => new Date();

function kindLabel(exercise: Exercise): string {
  const label = KIND_OPTIONS.find((o) => o.value === exercise.kind)?.label ?? exercise.kind;
  return exercise.kind === 'endurance' && exercise.distanceUnit ? `${label}, ${exercise.distanceUnit}` : label;
}

const openSession = (id: string) => navigate({ name: 'workout-session', id });

/** The running session: its name and running time, counting live, and Continue. */
function RunningTile({ session }: { session: WorkoutSession }) {
  const now = useNow(15000);
  return (
    <Tile aria-label="Running session">
      <div className={styles.running}>
        <div className={styles.runningText}>
          <span className={styles.runningName}>{session.name}</span>
          <span className={styles.runningTime}>{formatDuration(runningMinutes(session.startedAt, now))}</span>
        </div>
        <Button variant="primary" icon={<Play />} onClick={() => openSession(session.id)}>
          Continue
        </Button>
      </div>
    </Tile>
  );
}

/** The phone's Workouts screen: the running session, workouts, recent sessions and exercises. */
export function WorkoutsScreen() {
  const { db } = useServices();
  const data = useLiveQuery(
    async (database) => ({
      running: await getRunningSession(database),
      workouts: await listWorkouts(database),
      recent: await listRecentSessions(database),
      exercises: await listExercises(database),
    }),
    [],
  );
  const [workoutSheet, setWorkoutSheet] = useState<{ workout?: WorkoutView } | null>(null);
  const [exerciseSheet, setExerciseSheet] = useState<{ exercise?: Exercise } | null>(null);
  const newWorkout = () => setWorkoutSheet({});
  const newExercise = () => setExerciseSheet({});
  const canStart = data !== undefined && data.running === undefined;
  const start = (workoutId: string | null) => void startSession(db, clock, workoutId).then(openSession);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Workouts"
        actions={
          canStart && (
            <Button icon={<Play />} onClick={() => start(null)}>
              Empty session
            </Button>
          )
        }
      />
      {data?.running && <RunningTile session={data.running} />}
      <Section
        title="Workouts"
        count={data?.workouts.length}
        actions={
          <Button variant="ghost" icon={<Plus />} onClick={newWorkout}>
            New workout
          </Button>
        }
      >
        {data && data.workouts.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            text="No workouts"
            action={
              <Button variant="primary" icon={<Plus />} onClick={newWorkout}>
                New workout
              </Button>
            }
          />
        )}
        {data && data.workouts.length > 0 && (
          <Tile>
            <div className={styles.list}>
              {data.workouts.map((workout) => (
                <ListRow
                  key={workout.id}
                  title={workout.name}
                  meta={workout.exercises.map((e) => e.name).join(', ') || undefined}
                  onOpen={() => setWorkoutSheet({ workout })}
                  trailing={canStart && <IconButton label={`Start ${workout.name}`} tooltip="none" icon={<Play />} onClick={() => start(workout.id)} />}
                />
              ))}
            </div>
          </Tile>
        )}
      </Section>
      <Section title="Recent sessions" count={data?.recent.length}>
        {data && data.recent.length === 0 && <EmptyState icon={History} text="No finished sessions yet" />}
        {data && data.recent.length > 0 && (
          <Tile>
            <div className={styles.list}>
              {data.recent.map((session) => (
                <ListRow
                  key={session.id}
                  title={session.name}
                  meta={
                    <>
                      <span>{formatDate(localToday(new Date(session.startedAt)))}</span>
                      <span>
                        {clockTime(session.startedAt)}–{clockTime(session.endedAt ?? session.startedAt)}
                      </span>
                      <span>{formatDuration(sessionMinutes(session.startedAt, session.endedAt ?? session.startedAt))}</span>
                    </>
                  }
                  onOpen={() => openSession(session.id)}
                />
              ))}
            </div>
          </Tile>
        )}
      </Section>
      <Section
        title="Exercises"
        count={data?.exercises.length}
        actions={
          <Button variant="ghost" icon={<Plus />} onClick={newExercise}>
            New exercise
          </Button>
        }
      >
        {data && data.exercises.length === 0 && (
          <EmptyState
            icon={ListChecks}
            text="No exercises"
            action={
              <Button variant="primary" icon={<Plus />} onClick={newExercise}>
                New exercise
              </Button>
            }
          />
        )}
        {data && data.exercises.length > 0 && (
          <Tile>
            <div className={styles.list}>
              {data.exercises.map((exercise) => (
                <ListRow key={exercise.id} title={exercise.name} meta={kindLabel(exercise)} onOpen={() => setExerciseSheet({ exercise })} />
              ))}
            </div>
          </Tile>
        )}
      </Section>
      {workoutSheet && <WorkoutSheet workout={workoutSheet.workout} onClose={() => setWorkoutSheet(null)} />}
      {exerciseSheet && <ExerciseSheet exercise={exerciseSheet.exercise} onClose={() => setExerciseSheet(null)} />}
    </div>
  );
}
