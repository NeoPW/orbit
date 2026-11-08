import { useEffect, useRef, useState } from 'react';
import { ArrowRight, GripVertical, Play } from 'lucide-react';
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
import { useOpenTask } from './TaskPopup.tsx';
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
  /** Highlighted by the keyboard (Home's To do): outlined, scrolled into view, start button shown. */
  highlighted?: boolean;
}

/**
 * An open task as a row: a checkbox that completes it (through
 * `useCompleteTask`, with the next-step prompt and Undo), the title, the
 * next-step marker, optional importance and context, and the due date.
 * Clicking the row opens the task page. A row has no menu of its own.
 */
export function TaskRow({
  task,
  importance,
  context,
  onStartFocus,
  projectColor,
  projectName,
  compact = false,
  highlighted = false,
}: TaskRowProps) {
  const complete = useCompleteTask();
  const openTask = useOpenTask();
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted) wrapper.current?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);
  const mark = highlighted ? ` ${styles.highlighted}` : '';
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
      onOpen={() => openTask(task.id)}
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
    <div
      ref={wrapper}
      className={`${styles.colored} ${compact ? styles.outlined : ''}${mark}`}
      data-highlighted={highlighted || undefined}
      style={{ '--pc': projectColor } as CSSProperties}
    >
      {row}
    </div>
  ) : compact ? (
    <div ref={wrapper} className={`${styles.outlined} ${styles.neutral}${mark}`} data-highlighted={highlighted || undefined}>
      {row}
    </div>
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
  /**
   * Makes the rows reorderable (a project's open tasks): called with the task and its new index within its group
   * (the next steps, or the other tasks). Rows can be dragged by their handle, or moved with `Alt+↑` / `Alt+↓` on it.
   */
  onMove?: (taskId: string, toIndex: number) => void;
}

interface Drag {
  id: string;
  /** Pointer movement since the drag started, in pixels. */
  dy: number;
  /** Where the task would land in its group. */
  target: number;
}

/** Open tasks as `TaskRow`s in an `AnimatedList`, so a completed task leaves with a short animation. */
export function TaskList({ tasks, rowProps, label, onMove }: TaskListProps) {
  const container = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const refocus = useRef<string | null>(null);

  // After a keyboard move the row is re-rendered in its new place; give the handle its focus back.
  useEffect(() => {
    if (!refocus.current) return;
    const handle = container.current?.querySelector<HTMLElement>(`[data-task-id="${refocus.current}"] [data-handle]`);
    handle?.focus();
    refocus.current = null;
  }, [tasks]);

  if (!onMove) {
    return (
      <AnimatedList items={tasks} getKey={(task) => task.id} label={label} renderItem={(task) => <TaskRow task={task} {...rowProps?.(task)} />} />
    );
  }

  const groupOf = (task: Task) => tasks.filter((t) => t.isNextStep === task.isNextStep);

  function move(task: Task, to: number) {
    const group = groupOf(task);
    const clamped = Math.max(0, Math.min(to, group.length - 1));
    onMove?.(task.id, clamped);
    setAnnouncement(`${task.title} moved to place ${clamped + 1} of ${group.length}`);
  }

  function startDrag(event: React.PointerEvent<HTMLButtonElement>, task: Task) {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const group = groupOf(task);
    const from = group.findIndex((t) => t.id === task.id);
    const rows = group.map((t) => container.current?.querySelector<HTMLElement>(`[data-task-id="${t.id}"]`)?.getBoundingClientRect());
    const own = rows[from];
    if (!own) return;
    const startY = event.clientY;
    const center = own.top + own.height / 2;
    const targetFor = (dy: number) => rows.filter((r, i) => i !== from && r && r.top + r.height / 2 < center + dy).length;
    setDrag({ id: task.id, dy: 0, target: from });

    const onMoveEvent = (e: PointerEvent) => {
      const dy = e.clientY - startY;
      setDrag({ id: task.id, dy, target: targetFor(dy) });
    };
    const finish = (e: PointerEvent, commit: boolean) => {
      handle.removeEventListener('pointermove', onMoveEvent);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onCancel);
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      const target = targetFor(e.clientY - startY);
      setDrag(null);
      if (commit && target !== from) move(task, target);
    };
    const onUp = (e: PointerEvent) => finish(e, true);
    const onCancel = (e: PointerEvent) => finish(e, false);
    handle.addEventListener('pointermove', onMoveEvent);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
  }

  function onHandleKey(event: React.KeyboardEvent, task: Task) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    event.stopPropagation();
    const group = groupOf(task);
    const from = group.findIndex((t) => t.id === task.id);
    const to = from + (event.key === 'ArrowUp' ? -1 : 1);
    if (to < 0 || to >= group.length) return;
    refocus.current = task.id;
    move(task, to);
  }

  return (
    <div ref={container}>
      <AnimatedList
        items={tasks}
        getKey={(task) => task.id}
        label={label}
        renderItem={(task) => {
          const dragged = drag?.id === task.id;
          const group = drag ? groupOf(tasks.find((t) => t.id === drag.id) as Task) : [];
          const others = group.filter((t) => t.id !== drag?.id);
          const dropBefore = drag && !dragged && group.some((t) => t.id === task.id) && others[drag.target]?.id === task.id;
          const dropAfter = drag && !dragged && drag.target >= others.length && others[others.length - 1]?.id === task.id;
          return (
            <div
              className={`${styles.sortable} ${dragged ? styles.dragging : ''} ${dropBefore ? styles.dropBefore : ''} ${dropAfter ? styles.dropAfter : ''}`}
              data-task-id={task.id}
              style={dragged ? { transform: `translateY(${drag.dy}px)` } : undefined}
            >
              <button
                type="button"
                className={styles.handle}
                data-handle
                aria-label={`Move ${task.title}`}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onPointerDown={(e) => startDrag(e, task)}
                onKeyDown={(e) => onHandleKey(e, task)}
              >
                <GripVertical aria-hidden="true" />
              </button>
              <div className={styles.sortableRow}>
                <TaskRow task={task} {...rowProps?.(task)} />
              </div>
            </div>
          );
        }}
      />
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
