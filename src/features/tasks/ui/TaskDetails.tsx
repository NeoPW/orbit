import { ArrowRight, Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { StartFocusButton } from '../../timer/ui/StartFocusButton.tsx';
import { LogSection } from '../../work-log/ui/LogSection.tsx';
import { deleteTask, getTask, reopenTask, setNextStep } from '../data/tasks-repository.ts';
import { effectiveImportance } from '../domain/tasks.ts';
import styles from './TaskDetails.module.css';
import { TaskSheet } from './TaskSheet.tsx';
import { useCompleteTask } from './useCompleteTask.ts';

const clock = () => new Date();

export interface TaskDetailsProps {
  id: string;
  /** Called after the task was deleted and "Task deleted" was shown; the caller leaves the task. */
  onDeleted: (task: { projectId: string | null; goalId: string | null }) => void;
  /** Shown when the task does not exist (any more). */
  missing: ReactNode;
}

/** The content of a task, in the task page and in the task popup. */
export function TaskDetails({ id, onDeleted, missing }: TaskDetailsProps) {
  const { db } = useServices();
  const messages = useMessages();
  const complete = useCompleteTask();
  const loaded = useLiveQuery(async (database) => (await getTask(database, id)) ?? null, [id]);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (loaded === undefined) return null;
  if (loaded === null) return <>{missing}</>;

  const { task, projectTitle, projectColor, goalTitle, projectImportance } = loaded;
  const importance = effectiveImportance({
    importance: task.importance,
    projectImportance,
  });
  const open = task.status === 'open';

  function afterDelete() {
    onDeleted({ projectId: task.projectId, goalId: task.goalId });
    messages.show({ text: 'Task deleted' });
  }

  return (
    <>
      <Tile
        as="article"
        color={projectColor ?? undefined}
        tinted
        title={
          <div className={styles.titles}>
            <h1 className={styles.heading}>{task.title}</h1>
            <div className={styles.meta}>
              {task.projectId && projectTitle && projectColor && <Chip projectColor={projectColor}>{projectTitle}</Chip>}
              <Chip tone={open ? 'primary' : 'secondary'}>{open ? 'Open' : 'Done'}</Chip>
              {task.isNextStep && (
                <Chip tone="primary" icon={<ArrowRight aria-hidden="true" />}>
                  Next step
                </Chip>
              )}
              {open && task.dueDate && <DeadlineBadge deadline={task.dueDate} />}
            </div>
          </div>
        }
        actions={
          <>
            {open ? (
              <Button variant="primary" icon={<Check />} onClick={() => void complete(task)}>
                Complete
              </Button>
            ) : (
              <Button icon={<RotateCcw />} onClick={() => void reopenTask(db, clock, task.id)}>
                Reopen
              </Button>
            )}
            {open && <StartFocusButton target={{ taskId: task.id }} />}
            <Button icon={<Pencil />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" icon={<Trash2 />} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          </>
        }
      >
        {task.notes && <p className={styles.notes}>{task.notes}</p>}
      </Tile>
      <Tile aria-label="Details">
        <dl className={styles.details}>
          {task.dueDate && (
            <>
              <dt>Due</dt>
              <dd>{formatDate(task.dueDate)}</dd>
            </>
          )}
          <dt>Importance</dt>
          <dd>
            <ImportanceDots value={importance.value} inherited={importance.inherited} />
          </dd>
          <dt>Assigned to</dt>
          <dd>
            {task.projectId ? (
              <button type="button" className={styles.link} onClick={() => navigate({ name: 'project', id: task.projectId! })}>
                {projectTitle}
              </button>
            ) : task.goalId ? (
              <button type="button" className={styles.link} onClick={() => navigate({ name: 'goal', id: task.goalId! })}>
                {goalTitle}
              </button>
            ) : (
              'Standalone'
            )}
          </dd>
        </dl>
        {open && task.projectId && (
          <div>
            <Button onClick={() => void setNextStep(db, clock, task.id, !task.isNextStep)}>
              {task.isNextStep ? 'Remove from next steps' : 'Mark as next step'}
            </Button>
          </div>
        )}
      </Tile>
      <LogSection target={{ taskId: task.id }} color={projectColor ?? undefined} />
      {editing && <TaskSheet task={task} onDeleted={afterDelete} onClose={() => setEditing(false)} />}
      {confirming && (
        <ConfirmDialog
          title="Delete task"
          text={`Delete "${task.title}"? Work already logged on it stays.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            void deleteTask(db, clock, task.id).then(afterDelete);
          }}
        />
      )}
    </>
  );
}
