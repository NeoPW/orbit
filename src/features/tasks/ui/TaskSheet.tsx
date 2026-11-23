import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import { DateField } from '../../../core/ui/components/DateField.tsx';
import { Select, type SelectGroup, type SelectOption } from '../../../core/ui/components/Select.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextArea, TextField } from '../../../core/ui/components/TextField.tsx';
import { getGoal, listActiveGoals } from '../../goals/data/goals-repository.ts';
import { getProject, listProjectsByStatus } from '../../projects/data/projects-repository.ts';
import { createTask, deleteTask, updateTask, type Task } from '../data/tasks-repository.ts';

export interface TaskSheetProps {
  /** The task to edit; a new task without it. */
  task?: Task;
  /** Preselected assignment of a new task. */
  projectId?: string | null;
  goalId?: string | null;
  /** Called with the new task's id after creating. */
  onCreated?: (id: string) => void;
  /** Called after the task was deleted from the sheet (the sheet is then closed too). */
  onDeleted?: () => void;
  onClose: () => void;
}

const clock = () => new Date();

/** Active projects and goals plus the task's current ones, which may no longer be active. */
async function loadOptions(db: Db, projectId: string | null, goalId: string | null) {
  const [activeProjects, activeGoals, currentProject, currentGoal] = await Promise.all([
    listProjectsByStatus(db, 'active'),
    listActiveGoals(db),
    projectId ? getProject(db, projectId) : undefined,
    goalId ? getGoal(db, goalId) : undefined,
  ]);
  const projects: SelectOption[] = activeProjects.map((v) => ({
    value: `project:${v.project.id}`,
    label: v.project.title,
    color: v.color,
  }));
  if (currentProject && !activeProjects.some((v) => v.project.id === currentProject.project.id)) {
    projects.push({
      value: `project:${currentProject.project.id}`,
      label: currentProject.project.title,
      color: currentProject.color,
    });
  }
  const goals: SelectOption[] = activeGoals.map((g, index) => ({
    value: `goal:${g.goal.id}`,
    label: g.goal.title,
    color: goalColor(g.goal, index),
  }));
  if (currentGoal && !activeGoals.some((g) => g.goal.id === currentGoal.goal.id)) {
    goals.push({
      value: `goal:${currentGoal.goal.id}`,
      label: currentGoal.goal.title,
      color: goalColor(currentGoal.goal, goals.length),
    });
  }
  return { projects, goals };
}

export function TaskSheet({ task, projectId, goalId, onCreated, onDeleted, onClose }: TaskSheetProps) {
  const { db } = useServices();
  const initialProject = task ? task.projectId : (projectId ?? null);
  const initialGoal = task ? task.goalId : (goalId ?? null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null);
  const [dateValid, setDateValid] = useState(true);
  const [assignment, setAssignment] = useState(initialProject ? `project:${initialProject}` : initialGoal ? `goal:${initialGoal}` : '');
  const [error, setError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const options = useLiveQuery((database) => loadOptions(database, initialProject, initialGoal), [initialProject, initialGoal]);

  const assignmentOptions: (SelectOption | SelectGroup)[] = [{ value: '', label: 'Standalone' }];
  if (options?.projects.length) assignmentOptions.push({ group: 'Projects', options: options.projects });
  if (options?.goals.length) assignmentOptions.push({ group: 'Goals', options: options.goals });

  async function save() {
    if (title.trim() === '') {
      setError('Enter a title');
      return;
    }
    if (!dateValid) return;
    const [kind, id] = assignment.split(':');
    const input = {
      title,
      notes,
      dueDate,
      projectId: kind === 'project' ? id! : null,
      goalId: kind === 'goal' ? id! : null,
    };
    if (task) await updateTask(db, clock, task.id, input);
    else {
      const newId = await createTask(db, clock, input);
      onCreated?.(newId);
    }
    onClose();
  }

  return (
    <>
      <Sheet
        title={task ? 'Edit task' : 'New task'}
        onClose={onClose}
        onSave={() => void save()}
        saveDisabled={!dateValid}
        onDelete={task ? () => setConfirming(true) : undefined}
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
        <TextArea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <DateField label="Due date" value={dueDate} onChange={setDueDate} onValidity={setDateValid} />
        <Select label="Assigned to" value={assignment} onChange={setAssignment} options={assignmentOptions} />
      </Sheet>
      {confirming && task && (
        <ConfirmDialog
          title="Delete task"
          text={`Delete "${task.title}"? Work already logged on it stays.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            void deleteTask(db, clock, task.id).then(() => {
              onDeleted?.();
              onClose();
            });
          }}
        />
      )}
    </>
  );
}
