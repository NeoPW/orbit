import { ArrowRight, Play } from 'lucide-react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { AnimatedList } from '../../../core/ui/components/AnimatedList.tsx';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import type { CSSProperties } from 'react';
import type { Task } from '../data/tasks-repository.ts';
import styles from './TaskRow.module.css';
import { useCompleteTask } from './useCompleteTask.ts';

export interface TaskRowProps {
  task: Task;
  /** Shows importance dots (use `effectiveImportance`); left out by default. */
  importance?: { value: number; inherited: boolean };
  /** The project or goal the task belongs to, shown in the meta line (Home's To do). */
  context?: string;
  /** Shows a "Start focus" button at the end of the row. */
  onStartFocus?: () => void;
  /** CSS colour of the task's project (`projectColor(p)`); with `projectName` it shows the project chip and a colour rail. */
  projectColor?: string | null;
  /** The project's name, shown in the chip. */
  projectName?: string;
}

/**
 * An open task as a row: a checkbox that completes it (through
 * `useCompleteTask`, with the next-step prompt and Undo), the title, the
 * next-step marker, optional importance and context, and the due date.
 * Clicking the row opens the task page. A row has no menu of its own.
 */
export function TaskRow({ task, importance, context, onStartFocus, projectColor, projectName }: TaskRowProps) {
  const complete = useCompleteTask();
  const colored = Boolean(projectColor && projectName);
  const row = (
    <ListRow
      leading={<Checkbox checked={false} label={<span className="visually-hidden">Complete {task.title}</span>} onChange={() => void complete(task)} />}
      title={task.title}
      onOpen={() => navigate({ name: 'task', id: task.id })}
      meta={
        task.isNextStep || importance || context || task.dueDate || colored ? (
          <>
            {task.isNextStep && (
              <Chip tone="primary" icon={<ArrowRight aria-hidden="true" />}>
                Next step
              </Chip>
            )}
            {importance && <ImportanceDots value={importance.value} inherited={importance.inherited} />}
            {colored && <Chip projectColor={projectColor ?? undefined}>{projectName}</Chip>}
            {context && !colored && <span>{context}</span>}
            {task.dueDate && <DeadlineBadge deadline={task.dueDate} />}
          </>
        ) : undefined
      }
      trailing={onStartFocus && <IconButton label={`Start focus on ${task.title}`} icon={<Play />} onClick={onStartFocus} />}
    />
  );
  return colored ? (
    <div className={styles.colored} style={{ '--pc': projectColor } as CSSProperties}>
      {row}
    </div>
  ) : (
    row
  );
}

export interface TaskListProps {
  tasks: Task[];
  /** Extras for a row, for example `importance` or `context`. */
  rowProps?: (task: Task) => Omit<TaskRowProps, 'task'>;
  label?: string;
}

/** Open tasks as `TaskRow`s in an `AnimatedList`, so a completed task leaves with a short animation. */
export function TaskList({ tasks, rowProps, label }: TaskListProps) {
  return <AnimatedList items={tasks} getKey={(task) => task.id} label={label} renderItem={(task) => <TaskRow task={task} {...rowProps?.(task)} />} />;
}
