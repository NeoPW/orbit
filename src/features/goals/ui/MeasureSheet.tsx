import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { Measure, MeasureType } from '../../../core/db/schema.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { NumberField } from '../../../core/ui/components/NumberField.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { TextArea, TextField } from '../../../core/ui/components/TextField.tsx';
import { listHabits } from '../../habits/data/habits-repository.ts';
import { addMeasure, deleteMeasure, updateMeasure } from '../data/measures-repository.ts';
import { validateMeasure, type MeasureErrors } from '../domain/goals.ts';

export interface MeasureSheetProps {
  goalId: string;
  /** The measure to edit; a new measure without it. */
  measure?: Measure;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: MeasureType; label: string }[] = [
  { value: 'numeric', label: 'Number' },
  { value: 'boolean', label: 'Yes / no' },
  { value: 'habit', label: 'Habit' },
];

const clock = () => new Date();

export function MeasureSheet({ goalId, measure, onClose }: MeasureSheetProps) {
  const { db } = useServices();
  const [title, setTitle] = useState(measure?.title ?? '');
  const [description, setDescription] = useState(measure?.description ?? '');
  const [measureType, setMeasureType] = useState<MeasureType>(measure?.measureType ?? 'numeric');
  const [startValue, setStartValue] = useState<number | null>(measure ? measure.startValue : 0);
  const [targetValue, setTargetValue] = useState<number | null>(measure?.targetValue ?? null);
  const [currentValue, setCurrentValue] = useState<number | null>(measure ? measure.currentValue : 0);
  const [unit, setUnit] = useState(measure?.unit ?? '');
  const [step, setStep] = useState<number | null>(measure?.step ?? 1);
  const [done, setDone] = useState(measure?.measureType === 'boolean' && measure.currentValue === 1);
  const [habitId, setHabitId] = useState(measure?.habitId ?? '');
  const habits = useLiveQuery((database) => listHabits(database), []);
  const [errors, setErrors] = useState<MeasureErrors>({});
  const [confirming, setConfirming] = useState(false);

  async function save() {
    const found = validateMeasure({ title, measureType, startValue, targetValue, currentValue, step });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const fields = {
      title,
      description,
      measureType,
      startValue,
      targetValue,
      currentValue: measureType === 'boolean' ? (done ? 1 : 0) : currentValue,
      unit: unit || null,
      step: step ?? 1,
      habitId: measureType === 'habit' ? habitId || null : null,
    };
    if (measure) await updateMeasure(db, clock, measure.id, fields);
    else await addMeasure(db, clock, goalId, fields);
    onClose();
  }

  return (
    <>
      <Sheet title={measure ? 'Edit measure' : 'New measure'} onClose={onClose} onSave={() => void save()} onDelete={measure ? () => setConfirming(true) : undefined}>
        <TextField label="Title" value={title} error={errors.title} onChange={(event) => setTitle(event.target.value)} />
        <TextArea label="Description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        <SegmentedControl label="Type" options={TYPE_OPTIONS} value={measureType} onChange={setMeasureType} />
        {measureType === 'numeric' && (
          <>
            <NumberField label="Start value" inputMode="decimal" value={startValue} error={errors.startValue} onChange={setStartValue} />
            <NumberField label="Target value" inputMode="decimal" value={targetValue} error={errors.targetValue} onChange={setTargetValue} />
            <NumberField label="Current value" inputMode="decimal" value={currentValue} error={errors.currentValue} onChange={setCurrentValue} />
            <TextField label="Unit" value={unit} placeholder="km" onChange={(event) => setUnit(event.target.value)} />
            <NumberField label="Step" inputMode="decimal" value={step} error={errors.step} onChange={setStep} />
          </>
        )}
        {measureType === 'boolean' && <Switch label="Achieved" checked={done} onChange={setDone} />}
        {measureType === 'habit' && (
          <>
            <Select
              label="Habit"
              value={habitId}
              onChange={setHabitId}
              options={[{ value: '', label: 'None' }, ...(habits ?? []).map((h) => ({ value: h.id, label: h.title }))]}
            />
            <NumberField label="Target check-ins" value={targetValue} error={errors.targetValue} onChange={setTargetValue} />
          </>
        )}
      </Sheet>
      {confirming && measure && (
        <ConfirmDialog
          title="Delete measure"
          text={`Delete "${measure.title}"? The goal's progress is computed without it.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteMeasure(db, clock, measure.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
