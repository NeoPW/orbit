import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import fieldStyles from '../../../core/ui/components/TextField.module.css';
import { Select } from '../../../core/ui/components/Select.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { listExercises } from '../data/exercises-repository.ts';
import { createWorkout, deleteWorkout, loadLinkOptions, updateWorkout, type WorkoutView } from '../data/workouts-repository.ts';
import { addableExercises, moveDown, moveUp, remove, type WorkoutErrors } from '../domain/workouts.ts';
import styles from './WorkoutSheet.module.css';

const clock = () => new Date();

export interface WorkoutSheetProps {
  /** The workout to edit; a new workout without it. */
  workout?: WorkoutView;
  onClose: () => void;
}

export function WorkoutSheet({ workout, onClose }: WorkoutSheetProps) {
  const { db } = useServices();
  const [name, setName] = useState(workout?.name ?? '');
  const [exerciseIds, setExerciseIds] = useState<string[]>(workout?.exercises.map((e) => e.id) ?? []);
  const [project, setProject] = useState(workout?.projectId ?? '');
  const [goal, setGoal] = useState(workout?.goalId ?? '');
  const [habit, setHabit] = useState(workout?.habitId ?? '');
  const [errors, setErrors] = useState<WorkoutErrors>({});
  const [confirming, setConfirming] = useState(false);
  const exercises = useLiveQuery((database) => listExercises(database), []);
  const links = useLiveQuery(
    (database) => loadLinkOptions(database, { projectId: workout?.projectId ?? null, goalId: workout?.goalId ?? null, habitId: workout?.habitId ?? null }),
    [workout?.id],
  );
  const byId = new Map((exercises ?? []).map((e) => [e.id, e]));
  const addable = addableExercises(exercises ?? [], exerciseIds);

  async function save() {
    const input = { name, exerciseIds, projectId: project || null, goalId: goal || null, habitId: habit || null };
    const result = workout ? await updateWorkout(db, clock, workout.id, input) : await createWorkout(db, clock, input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet title={workout ? 'Edit workout' : 'New workout'} onClose={onClose} onSave={() => void save()} onDelete={workout ? () => setConfirming(true) : undefined}>
        <TextField
          label="Name"
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((e) => ({ ...e, name: undefined }));
          }}
        />
        <div>
          <ul className={styles.list} aria-label="Exercises">
            {exerciseIds.map((id, index) => (
              <li key={id} className={styles.item}>
                <span className={styles.name}>{byId.get(id)?.name ?? '…'}</span>
                <IconButton label="Move up" icon={<ArrowUp />} className={styles.button} disabled={index === 0} onClick={() => setExerciseIds((l) => moveUp(l, index))} />
                <IconButton label="Move down" icon={<ArrowDown />} className={styles.button} disabled={index === exerciseIds.length - 1} onClick={() => setExerciseIds((l) => moveDown(l, index))} />
                <IconButton label="Remove" icon={<X />} className={styles.button} onClick={() => setExerciseIds((l) => remove(l, index))} />
              </li>
            ))}
          </ul>
          {errors.exercises && <p className={fieldStyles.error}>{errors.exercises}</p>}
        </div>
        <Select
          label="Add exercise"
          value=""
          onChange={(id) => {
            if (id === '') return;
            setExerciseIds((l) => [...l, id]);
            setErrors((e) => ({ ...e, exercises: undefined }));
          }}
          options={[{ value: '', label: addable.length === 0 ? 'No more exercises' : 'Choose…' }, ...addable.map((e) => ({ value: e.id, label: e.name }))]}
        />
        <Select label="Project" value={project} onChange={setProject} options={[{ value: '', label: 'None' }, ...(links?.projects ?? [])]} />
        <Select label="Goal" value={goal} onChange={setGoal} options={[{ value: '', label: 'None' }, ...(links?.goals ?? [])]} />
        <Select label="Habit" value={habit} onChange={setHabit} options={[{ value: '', label: 'None' }, ...(links?.habits ?? [])]} />
      </Sheet>
      {confirming && workout && (
        <ConfirmDialog
          title="Delete workout"
          text={`Delete "${workout.name}"?`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteWorkout(db, clock, workout.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
