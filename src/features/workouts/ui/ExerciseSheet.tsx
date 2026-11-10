import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { DistanceUnit, ExerciseKind } from '../../../core/db/schema.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { createExercise, deleteExercise, updateExercise, type Exercise } from '../data/exercises-repository.ts';
import type { ExerciseErrors } from '../domain/workouts.ts';

export const KIND_OPTIONS: { value: ExerciseKind; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'endurance', label: 'Endurance' },
];

const UNIT_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'km' },
  { value: 'm', label: 'm' },
];

const clock = () => new Date();

export interface ExerciseSheetProps {
  /** The exercise to edit; a new exercise without it. */
  exercise?: Exercise;
  onClose: () => void;
}

export function ExerciseSheet({ exercise, onClose }: ExerciseSheetProps) {
  const { db } = useServices();
  const [name, setName] = useState(exercise?.name ?? '');
  const [kind, setKind] = useState<ExerciseKind>(exercise?.kind ?? 'strength');
  const [unit, setUnit] = useState<DistanceUnit>(exercise?.distanceUnit ?? 'km');
  const [errors, setErrors] = useState<ExerciseErrors>({});
  const [confirming, setConfirming] = useState(false);

  async function save() {
    const input = { name, kind, distanceUnit: kind === 'endurance' ? unit : null };
    const result = exercise ? await updateExercise(db, clock, exercise.id, input) : await createExercise(db, clock, input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet title={exercise ? 'Edit exercise' : 'New exercise'} onClose={onClose} onSave={() => void save()} onDelete={exercise ? () => setConfirming(true) : undefined}>
        <TextField
          label="Name"
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors({});
          }}
        />
        <SegmentedControl label="Type" options={KIND_OPTIONS} value={kind} onChange={setKind} />
        {kind === 'endurance' && <SegmentedControl label="Distance unit" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />}
      </Sheet>
      {confirming && exercise && (
        <ConfirmDialog
          title="Delete exercise"
          text={`Delete "${exercise.name}"? It is removed from every workout that contains it.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteExercise(db, clock, exercise.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
