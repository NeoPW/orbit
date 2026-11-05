import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { ScheduleType } from '../../../core/db/schema.ts';
import fieldStyles from '../../../core/ui/components/TextField.module.css';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { NumberField } from '../../../core/ui/components/NumberField.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { TimeField } from '../../../core/ui/components/TimeField.tsx';
import { WeekdayPicker } from '../../../core/ui/components/WeekdayPicker.tsx';
import { getGoal, listActiveGoals } from '../../goals/data/goals-repository.ts';
import { getProject, listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { createHabit, deleteHabit, updateHabit, type Habit, type HabitErrors } from '../data/habits-repository.ts';

export interface HabitSheetProps {
  /** The habit to edit; a new habit without it. */
  habit?: Habit;
  /** Preselected links of a new habit (the project or goal page's "New habit"). */
  projectId?: string | null;
  goalId?: string | null;
  onClose: () => void;
}

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'times_per_week', label: 'Times per week' },
];

const clock = () => new Date();

/** Non-completed projects and active goals, plus the habit's current links, which may no longer qualify. */
async function loadOptions(db: Db, projectId: string | null, goalId: string | null) {
  const [openProjects, activeGoals, currentProject, currentGoal] = await Promise.all([
    listProjectsByStatus(db, 'active', 'backlog', 'paused'),
    listActiveGoals(db),
    projectId ? getProject(db, projectId) : undefined,
    goalId ? getGoal(db, goalId) : undefined,
  ]);
  const projects = openProjects.map((v) => ({ value: v.project.id, label: v.project.title }));
  if (currentProject && !projects.some((p) => p.value === currentProject.project.id)) {
    projects.push({ value: currentProject.project.id, label: `${currentProject.project.title} (${currentProject.project.status})` });
  }
  const goals = activeGoals.map((g) => ({ value: g.goal.id, label: g.goal.title }));
  if (currentGoal && !goals.some((g) => g.value === currentGoal.goal.id)) {
    goals.push({ value: currentGoal.goal.id, label: `${currentGoal.goal.title} (${currentGoal.goal.status})` });
  }
  return { projects, goals };
}

export function HabitSheet({ habit, projectId, goalId, onClose }: HabitSheetProps) {
  const { db } = useServices();
  const initialProject = habit ? habit.projectId : (projectId ?? null);
  const initialGoal = habit ? habit.goalId : (goalId ?? null);
  const [title, setTitle] = useState(habit?.title ?? '');
  const [project, setProject] = useState(initialProject ?? '');
  const [goal, setGoal] = useState(initialGoal ?? '');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(habit?.scheduleType ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState<number | null>(habit?.timesPerWeek ?? 3);
  const [reminder, setReminder] = useState<string | null>(habit?.reminderTime ?? null);
  const [reminderValid, setReminderValid] = useState(true);
  const [active, setActive] = useState(habit?.active ?? true);
  const [errors, setErrors] = useState<HabitErrors>({});
  const [confirming, setConfirming] = useState(false);
  const options = useLiveQuery((database) => loadOptions(database, initialProject, initialGoal), [initialProject, initialGoal]);

  async function save() {
    if (!reminderValid) return;
    const input = {
      title,
      projectId: project || null,
      goalId: goal || null,
      scheduleType,
      weekdays,
      timesPerWeek,
      reminderTime: reminder,
      active,
    };
    const result = habit ? await updateHabit(db, clock, habit.id, input) : await createHabit(db, clock, input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet
        title={habit ? 'Edit habit' : 'New habit'}
        onClose={onClose}
        onSave={() => void save()}
        saveDisabled={!reminderValid}
        onDelete={habit ? () => setConfirming(true) : undefined}
      >
        <TextField
          label="Title"
          value={title}
          error={errors.title}
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((e) => ({ ...e, title: undefined }));
          }}
        />
        <Select label="Project" value={project} onChange={setProject} options={[{ value: '', label: 'None' }, ...(options?.projects ?? [])]} />
        <Select label="Goal" value={goal} onChange={setGoal} options={[{ value: '', label: 'None' }, ...(options?.goals ?? [])]} />
        <SegmentedControl label="Schedule" options={SCHEDULE_OPTIONS} value={scheduleType} onChange={setScheduleType} />
        {scheduleType === 'weekdays' && (
          <div>
            <WeekdayPicker
              value={weekdays}
              onChange={(days) => {
                setWeekdays(days);
                setErrors((e) => ({ ...e, weekdays: undefined }));
              }}
            />
            {errors.weekdays && <p className={fieldStyles.error}>{errors.weekdays}</p>}
          </div>
        )}
        {scheduleType === 'times_per_week' && (
          <NumberField
            label="Times per week"
            value={timesPerWeek}
            error={errors.timesPerWeek}
            onChange={(n) => {
              setTimesPerWeek(n);
              setErrors((e) => ({ ...e, timesPerWeek: undefined }));
            }}
          />
        )}
        <TimeField label="Reminder time" value={reminder} onChange={setReminder} onValidity={setReminderValid} />
        <Switch label="Active" checked={active} onChange={setActive} />
      </Sheet>
      {confirming && habit && (
        <ConfirmDialog
          title="Delete habit"
          text={`Delete "${habit.title}"? A measure linked to it stays, without the habit.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteHabit(db, clock, habit.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
