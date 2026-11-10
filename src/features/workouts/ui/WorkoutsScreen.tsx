import { Dumbbell, ListChecks, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { listExercises, type Exercise } from '../data/exercises-repository.ts';
import { listWorkouts, type WorkoutView } from '../data/workouts-repository.ts';
import { ExerciseSheet, KIND_OPTIONS } from './ExerciseSheet.tsx';
import { WorkoutSheet } from './WorkoutSheet.tsx';

function kindLabel(exercise: Exercise): string {
  const label = KIND_OPTIONS.find((o) => o.value === exercise.kind)?.label ?? exercise.kind;
  return exercise.kind === 'endurance' && exercise.distanceUnit ? `${label}, ${exercise.distanceUnit}` : label;
}

/** The phone's Workouts screen: workouts and the exercises they are made of. */
export function WorkoutsScreen() {
  const data = useLiveQuery(async (db) => ({ workouts: await listWorkouts(db), exercises: await listExercises(db) }), []);
  const [workoutSheet, setWorkoutSheet] = useState<{ workout?: WorkoutView } | null>(null);
  const [exerciseSheet, setExerciseSheet] = useState<{ exercise?: Exercise } | null>(null);
  const newWorkout = () => setWorkoutSheet({});
  const newExercise = () => setExerciseSheet({});

  return (
    <>
      <PageHeader title="Workouts" />
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
            {data.workouts.map((workout) => (
              <ListRow
                key={workout.id}
                title={workout.name}
                meta={workout.exercises.map((e) => e.name).join(', ') || undefined}
                onOpen={() => setWorkoutSheet({ workout })}
              />
            ))}
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
            {data.exercises.map((exercise) => (
              <ListRow key={exercise.id} title={exercise.name} meta={kindLabel(exercise)} onOpen={() => setExerciseSheet({ exercise })} />
            ))}
          </Tile>
        )}
      </Section>
      {workoutSheet && <WorkoutSheet workout={workoutSheet.workout} onClose={() => setWorkoutSheet(null)} />}
      {exerciseSheet && <ExerciseSheet exercise={exerciseSheet.exercise} onClose={() => setExerciseSheet(null)} />}
    </>
  );
}
