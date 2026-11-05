import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { addDays, useToday } from '../../../core/dates/today.ts';
import type { Goal, GoalStatus } from '../../../core/db/schema.ts';
import { ColorPicker } from '../../../core/ui/components/ColorPicker.tsx';
import { DateField } from '../../../core/ui/components/DateField.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextArea, TextField } from '../../../core/ui/components/TextField.tsx';
import { GOAL_COLORS } from '../../../core/ui/palette.ts';
import { createGoal, setGoalStatus, updateGoal } from '../data/goals-repository.ts';
import { validateGoal, type GoalErrors } from '../domain/goals.ts';

export interface GoalSheetProps {
  /** The goal to edit; a new goal without it. */
  goal?: Goal;
  /** Called with the new goal's id after creating. */
  onCreated?: (id: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const clock = () => new Date();
const DEFAULT_LENGTH_DAYS = 90;

export function GoalSheet({ goal, onCreated, onClose }: GoalSheetProps) {
  const { db } = useServices();
  const today = useToday();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [startDate, setStartDate] = useState<string | null>(goal ? goal.startDate : today);
  const [endDate, setEndDate] = useState<string | null>(goal ? goal.endDate : addDays(today, DEFAULT_LENGTH_DAYS));
  const [color, setColor] = useState<string | null>(goal?.color ?? null);
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'active');
  const [validity, setValidity] = useState({ start: true, end: true });
  const [errors, setErrors] = useState<GoalErrors>({});

  async function save() {
    const found = validateGoal({ title, startDate, endDate });
    setErrors(found);
    if (Object.keys(found).length > 0 || !validity.start || !validity.end || !startDate || !endDate) return;
    const input = { title, description, startDate, endDate, color };
    if (goal) {
      await updateGoal(db, clock, goal.id, input);
      if (status !== goal.status) await setGoalStatus(db, clock, goal.id, status);
    } else {
      const newId = await createGoal(db, clock, input);
      onCreated?.(newId);
    }
    onClose();
  }

  return (
    <Sheet title={goal ? 'Edit goal' : 'New goal'} onClose={onClose} onSave={() => void save()} saveDisabled={!validity.start || !validity.end}>
      <TextField label="Title" value={title} error={errors.title} onChange={(event) => setTitle(event.target.value)} />
      <TextArea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
      <DateField label="Start date" value={startDate} error={errors.startDate} onChange={setStartDate} onValidity={(start) => setValidity((v) => ({ ...v, start }))} />
      <DateField label="End date" value={endDate} error={errors.endDate} onChange={setEndDate} onValidity={(end) => setValidity((v) => ({ ...v, end }))} />
      <ColorPicker label="Color" colors={GOAL_COLORS} value={color} onChange={setColor} allowAuto />
      {goal && <SegmentedControl label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />}
    </Sheet>
  );
}
