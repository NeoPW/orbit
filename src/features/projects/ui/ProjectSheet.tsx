import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { ProjectStatus } from '../../../core/db/schema.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { DateField } from '../../../core/ui/components/DateField.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextArea, TextField } from '../../../core/ui/components/TextField.tsx';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { getGoal, listActiveGoals } from '../../goals/data/goals-repository.ts';
import { createProject, deleteProject, updateProject, type Project } from '../data/projects-repository.ts';

export interface ProjectSheetProps {
  /** The project to edit; a new project without it. */
  project?: Project;
  /** Preselected goal of a new project (the goal page's "Add project"). */
  goalId?: string | null;
  /** Called with the new project's id after creating. */
  onCreated?: (id: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const IMPORTANCE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

const clock = () => new Date();

/** Areas, and the active goals plus the project's current goal, which may no longer be active. */
async function loadOptions(db: Db, currentGoalId: string | null) {
  const [areas, activeGoals, current] = await Promise.all([
    listAreas(db),
    listActiveGoals(db),
    currentGoalId ? getGoal(db, currentGoalId) : undefined,
  ]);
  const goals = activeGoals.map((g) => ({ value: g.goal.id, label: g.goal.title }));
  if (current && !activeGoals.some((g) => g.goal.id === current.goal.id)) {
    goals.push({ value: current.goal.id, label: `${current.goal.title} (${current.goal.status})` });
  }
  return { areas: areas.map((a) => ({ value: a.id, label: a.name })), goals };
}

export function ProjectSheet({ project, goalId, onCreated, onClose }: ProjectSheetProps) {
  const { db } = useServices();
  const initialGoal = project ? project.goalId : (goalId ?? null);
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [areaId, setAreaId] = useState(project?.areaId ?? '');
  const [goal, setGoal] = useState(initialGoal ?? '');
  const [importance, setImportance] = useState(project?.importance ?? 3);
  const [deadline, setDeadline] = useState<string | null>(project?.deadline ?? null);
  const [deadlineValid, setDeadlineValid] = useState(true);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active');
  const [error, setError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const options = useLiveQuery((database) => loadOptions(database, initialGoal), [initialGoal]);

  async function save() {
    if (title.trim() === '') {
      setError('Enter a title');
      return;
    }
    if (!deadlineValid) return;
    const input = { title, description, areaId: areaId || null, goalId: goal || null, importance, deadline, status };
    if (project) await updateProject(db, clock, project.id, input);
    else {
      const newId = await createProject(db, clock, input);
      onCreated?.(newId);
    }
    onClose();
  }

  return (
    <>
      <Sheet
        title={project ? 'Edit project' : 'New project'}
        onClose={onClose}
        onSave={() => void save()}
        saveDisabled={!deadlineValid}
        onDelete={project ? () => setConfirming(true) : undefined}
      >
        <TextField
          label="Title"
          value={title}
          error={error}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(undefined);
          }}
        />
        <TextArea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Select label="Area" value={areaId} onChange={setAreaId} options={[{ value: '', label: 'None' }, ...(options?.areas ?? [])]} />
        <Select label="Goal" value={goal} onChange={setGoal} options={[{ value: '', label: 'None' }, ...(options?.goals ?? [])]} />
        <SegmentedControl label="Importance" options={IMPORTANCE_OPTIONS} value={importance} onChange={setImportance} />
        <DateField label="Deadline" value={deadline} onChange={setDeadline} onValidity={setDeadlineValid} />
        <SegmentedControl label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </Sheet>
      {confirming && project && (
        <ConfirmDialog
          title="Delete project"
          text={`Delete "${project.title}" and its tasks? Its habits stay, without the project.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteProject(db, clock, project.id).then(onClose);
          }}
        />
      )}
    </>
  );
}
