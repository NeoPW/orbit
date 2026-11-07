import { ArrowRight, Play } from 'lucide-react';
import { navigate } from '../../../core/routing/useRoute.ts';
import { AnimatedList } from '../../../core/ui/components/AnimatedList.tsx';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { Checkbox } from '../../../core/ui/components/Checkbox.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { deadlineBadge } from '../../../core/dates/deadline.ts';
import { useToday } from '../../../core/dates/today.ts';
import { useSettings } from '../../settings/data/settings.ts';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { useIsPhone } from '../../../core/ui/useIsPhone.ts';
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
  /** A quieter row (Home's To do): only the project (dot and name in its colour) and the deadline as small text at the right, the start button on hover. */
  compact?: boolean;
}

/**
 * An open task as a row: a checkbox that completes it (through
 * `useCompleteTask`, with the next-step prompt and Undo), the title, the
 * next-step marker, optional importance and context, and the due date.
 * Clicking the row opens the task page. A row has no menu of its own.
 */
export function TaskRow({ task, importance, context, onStartFocus, projectColor, projectName, compact = false }: TaskRowProps) {
  const complete = useCompleteTask();
  const isPhone = useIsPhone();
  const colored = Boolean(projectColor && projectName);
  const hasTags = task.isNextStep || importance || context || task.dueDate || colored;
  const tags = hasTags ? (
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
  ) : null;
  const row = (
    <ListRow
      leading={
        <Checkbox
          checked={false}
          label={<span className="visually-hidden">Complete {task.title}</span>}
          onChange={() => void complete(task)}
        />
      }
      title={task.title}
      onOpen={() => navigate({ name: 'task', id: task.id })}
      // On the phone the compact tags go under the title, and the start button is always shown (no hover).
      meta={
        compact && isPhone ? (
          <CompactTags task={task} context={context} projectColor={colored ? projectColor : null} projectName={projectName} />
        ) : tags && !compact ? (
          tags
        ) : undefined
      }
      trailing={
        compact || onStartFocus ? (
          <>
            {compact && !isPhone && (
              <CompactTags task={task} context={context} projectColor={colored ? projectColor : null} projectName={projectName} />
            )}
            {onStartFocus && (
              <span className={compact && !isPhone ? styles.startOnHover : undefined}>
                <IconButton label={`Start focus on ${task.title}`} icon={<Play />} onClick={onStartFocus} />
              </span>
            )}
          </>
        ) : undefined
      }
    />
  );
  return colored ? (
    <div className={`${styles.colored} ${compact ? styles.outlined : ''}`} style={{ '--pc': projectColor } as CSSProperties}>
      {row}
    </div>
  ) : compact ? (
    <div className={`${styles.outlined} ${styles.neutral}`}>{row}</div>
  ) : (
    row
  );
}

/** Project and deadline as small text; colour carries the meaning (project colour, red when overdue, amber when soon). */
function CompactTags({
  task,
  context,
  projectColor,
  projectName,
}: {
  task: Task;
  context?: string;
  projectColor: string | null | undefined;
  projectName?: string;
}) {
  const today = useToday();
  const { settings } = useSettings();
  const badge = task.dueDate ? deadlineBadge(task.dueDate, today, settings.leadDays) : null;
  const label = projectColor ? projectName : context;
  if (!label && !badge) return null;
  return (
    <span className={styles.compact} style={projectColor ? ({ '--pc': projectColor } as CSSProperties) : undefined}>
      {label && (
        <span className={styles.compactProject}>
          {projectColor && <span className={styles.compactDot} aria-hidden="true" />}
          {label}
        </span>
      )}
      {badge && (
        <span className={`${styles.compactDue} ${badge.tone === 'overdue' ? styles.overdue : badge.tone === 'soon' ? styles.soon : ''}`}>
          {badge.label}
        </span>
      )}
    </span>
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
  return (
    <AnimatedList
      items={tasks}
      getKey={(task) => task.id}
      label={label}
      renderItem={(task) => <TaskRow task={task} {...rowProps?.(task)} />}
    />
  );
}
