import { Focus, Maximize2, Play, Square, Trash2 } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useNow } from '../../../core/dates/today.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { elapsedMs } from '../domain/timer.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { useServices } from '../../../app/services.ts';
import { useSettings } from '../../settings/data/settings.ts';
import type { ActiveProjectItem } from '../../home/data/home-queries.ts';
import { listActiveHabitOptions } from '../../home/data/home-queries.ts';
import { createTask, listOpenTasks } from '../../tasks/data/tasks-repository.ts';
import { getTimerView, type TimerView } from '../data/timer-view.ts';
import styles from './FocusPanel.module.css';
import { quickStartPlan, type QuickStartPlan } from '../domain/quick-start.ts';
import { QuickStartField } from './QuickStartField.tsx';
import { TimerReadout } from './TimerReadout.tsx';
import { useStartFocus } from './useStartFocus.ts';
import { useStopTimer } from './useStopTimer.tsx';

const clock = () => new Date();

/** Planned lengths in minutes; 0 stands for open-ended. */
const LENGTHS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 0, label: 'Open-ended' },
];

export interface FocusPanelProps {
  /** The active projects, for `# project` and for starting on a project. */
  projects: ActiveProjectItem[];
}

/** Home's focus panel: type what to work on and start, or the running session with Stop, Discard and Focus mode. */
export function FocusPanel({ projects }: FocusPanelProps) {
  const view = useLiveQuery(getTimerView, []);
  if (view === undefined) return <section className={styles.panel} aria-label="Focus" />;
  return view ? <Running view={view} /> : <Idle projects={projects} />;
}

function Idle({ projects }: FocusPanelProps) {
  const { db } = useServices();
  const { settings } = useSettings();
  const { start } = useStartFocus();
  const openTasks = useLiveQuery(listOpenTasks, []);
  const habitOptions = useLiveQuery(listActiveHabitOptions, []);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<{ id: string; kind: 'task' | 'habit' } | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const stored = settings.focusMinutes ?? 0;
  const length = minutes ?? (LENGTHS.some((l) => l.value === stored) ? stored : 0);

  const taskOptions = [
    ...(openTasks ?? []).map((v) => ({
      id: v.task.id,
      kind: 'task' as const,
      title: v.task.title,
      projectId: v.task.projectId,
      projectTitle: v.projectTitle,
      projectColor: v.projectColor,
    })),
    ...(habitOptions ?? []).map((h) => ({
      id: h.id,
      kind: 'habit' as const,
      title: h.title,
      projectId: h.projectId,
      projectTitle: h.projectTitle,
      projectColor: h.projectColor,
    })),
  ];
  const projectOptions = projects.map((p) => ({
    id: p.view.project.id,
    title: p.view.project.title,
    color: p.view.color,
  }));
  const plan: QuickStartPlan = picked
    ? picked.kind === 'habit'
      ? { kind: 'habit', habitId: picked.id }
      : { kind: 'task', taskId: picked.id }
    : quickStartPlan(text, taskOptions, projectOptions);
  const error = plan.kind === 'error' ? plan.message : null;
  const canStart = plan.kind !== 'empty' && plan.kind !== 'error';

  async function begin() {
    if (!canStart) return;
    const planned = length === 0 ? null : length;
    if (plan.kind === 'task') await start({ taskId: plan.taskId }, planned);
    else if (plan.kind === 'habit') await start({ habitId: plan.habitId }, planned);
    else if (plan.kind === 'project') await start({ projectId: plan.projectId }, planned);
    else if (plan.kind === 'new') {
      const taskId = await createTask(db, clock, {
        title: plan.title,
        notes: '',
        dueDate: null,
        importance: null,
        projectId: plan.projectId,
        goalId: null,
      });
      await start({ taskId }, planned);
    }
  }

  return (
    <section className={styles.panel} aria-label="Focus">
      <h2 className={styles.heading}>
        <Focus aria-hidden="true" /> Focus
      </h2>
      <div className={styles.row}>
        <div className={styles.choose}>
          <QuickStartField
            value={text}
            onChange={(value) => {
              setText(value);
              setPicked(null);
            }}
            tasks={taskOptions}
            projects={projectOptions}
            onPickTask={(task) => {
              setText(task.title);
              setPicked({ id: task.id, kind: task.kind });
            }}
            onSubmit={() => void begin()}
            error={error}
          />
        </div>
        <SegmentedControl label="Planned length" options={LENGTHS} value={length} onChange={setMinutes} />
        <Button variant="primary" icon={<Play />} disabled={!canStart} onClick={() => void begin()}>
          Start
        </Button>
      </div>
    </section>
  );
}

/** The project of the running timer (its name and colour come with the timer view). */
function runningProject(view: TimerView): { name: string; color: string } | null {
  return view.projectColor && view.projectName ? { name: view.projectName, color: view.projectColor } : null;
}

function SessionProgress({ startedAt, plannedMinutes }: { startedAt: string; plannedMinutes: number }) {
  const now = useNow(1000);
  const percent = Math.min(100, Math.round((elapsedMs(startedAt, now) / (plannedMinutes * 60000)) * 100));
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label="Session progress"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.progressFill} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Running({ view }: { view: TimerView }) {
  const stop = useStopTimer(view);
  const { timer } = view;
  const project = runningProject(view);
  return (
    <section
      className={`${styles.panel} ${styles.raised}`}
      aria-label="Focus"
      style={project ? ({ '--pc': project.color } as CSSProperties) : undefined}
    >
      <div className={styles.running}>
        <div className={styles.what}>
          <div className={styles.tags}>
            <span className={styles.state}>
              <span className={styles.stateDot} aria-hidden="true" />
              Running
            </span>
            {project && <Chip projectColor={project.color}>{project.name}</Chip>}
          </div>
          <span className={styles.title}>{view.title}</span>
        </div>
        <div className={styles.readout}>
          <TimerReadout startedAt={timer.startedAt} plannedMinutes={timer.plannedMinutes} />
        </div>
      </div>
      {timer.plannedMinutes !== null && <SessionProgress startedAt={timer.startedAt} plannedMinutes={timer.plannedMinutes} />}
      <div className={styles.buttons}>
        <div className={styles.actions}>
          <Button variant="primary" icon={<Square />} onClick={stop.askStop}>
            Stop
          </Button>
          <Button variant="ghost" icon={<Trash2 />} onClick={stop.askDiscard}>
            Discard
          </Button>
        </div>
        <Button icon={<Maximize2 />} onClick={() => navigate({ name: 'focus' })}>
          Focus mode
        </Button>
      </div>
      {stop.dialogs}
    </section>
  );
}
