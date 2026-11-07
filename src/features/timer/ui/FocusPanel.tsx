import { CircleCheck, Focus, Maximize2, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { focusFieldRequest } from '../../../app/shortcuts/requests.ts';
import { useNow } from '../../../core/dates/today.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { workedMs, type SessionClock } from '../domain/timer.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { useServices } from '../../../app/services.ts';
import type { ActiveProjectItem } from '../../home/data/home-queries.ts';
import { listActiveHabitOptions } from '../../home/data/home-queries.ts';
import { createTask, listOpenTasks } from '../../tasks/data/tasks-repository.ts';
import { getTimerView, type TimerView } from '../data/timer-view.ts';
import styles from './FocusPanel.module.css';
import { quickStartPlan, type QuickStartPlan } from '../domain/quick-start.ts';
import { QuickStartField } from './QuickStartField.tsx';
import { TimerReadout } from './TimerReadout.tsx';
import { useStartFocus } from './useStartFocus.ts';
import { useSessionActions } from './useSessionActions.tsx';

const clock = () => new Date();

export interface FocusPanelProps {
  /** The active projects, for `# project` and for starting on a project. */
  projects: ActiveProjectItem[];
}

/** Home's focus panel: type what to work on and start, or the session with Pause or Resume, Complete and Focus mode. */
export function FocusPanel({ projects }: FocusPanelProps) {
  const view = useLiveQuery(getTimerView, []);
  if (view === undefined) return <section className={styles.panel} aria-label="Focus" />;
  return view ? <Running view={view} /> : <Idle projects={projects} />;
}

function Idle({ projects }: FocusPanelProps) {
  const { db } = useServices();
  const { start } = useStartFocus();
  const openTasks = useLiveQuery(listOpenTasks, []);
  const habitOptions = useLiveQuery(listActiveHabitOptions, []);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<{ id: string; kind: 'task' | 'habit' } | null>(null);
  const panel = useRef<HTMLElement>(null);

  // `F` puts the cursor in the field, also when it asked before Home was shown.
  useEffect(
    () =>
      focusFieldRequest.subscribe(() => {
        const input = panel.current?.querySelector<HTMLInputElement>('input');
        input?.focus();
        input?.scrollIntoView({ block: 'nearest' });
      }),
    [],
  );

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
    if (plan.kind === 'task') await start({ taskId: plan.taskId });
    else if (plan.kind === 'habit') await start({ habitId: plan.habitId });
    else if (plan.kind === 'project') await start({ projectId: plan.projectId });
    else if (plan.kind === 'new') {
      const taskId = await createTask(db, clock, {
        title: plan.title,
        notes: '',
        dueDate: null,
        importance: null,
        projectId: plan.projectId,
        goalId: null,
      });
      await start({ taskId });
    }
  }

  return (
    <section ref={panel} className={styles.panel} aria-label="Focus">
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

function SessionProgress({ session, limitMinutes }: { session: SessionClock; limitMinutes: number }) {
  const now = useNow(1000);
  const percent = Math.min(100, Math.round((workedMs(session, now) / (limitMinutes * 60000)) * 100));
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
  const actions = useSessionActions(view);
  const { timer } = view;
  const project = runningProject(view);
  const paused = timer.pausedAt !== null;
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
              {paused ? 'Paused' : 'Running'}
            </span>
            {project && <Chip projectColor={project.color}>{project.name}</Chip>}
          </div>
          <span className={styles.title}>{view.title}</span>
        </div>
        <div className={styles.readout}>
          <TimerReadout session={timer} limitMinutes={timer.plannedMinutes} />
        </div>
      </div>
      {timer.plannedMinutes !== null && <SessionProgress session={timer} limitMinutes={timer.plannedMinutes} />}
      <div className={styles.buttons}>
        <div className={styles.actions}>
          {paused ? (
            <Button variant="primary" icon={<Play />} onClick={actions.resume}>
              Resume
            </Button>
          ) : (
            <Button variant="primary" icon={<Pause />} onClick={actions.pause}>
              Pause
            </Button>
          )}
          <Button icon={<CircleCheck />} onClick={actions.askComplete}>
            Complete
          </Button>
        </div>
        <Button icon={<Maximize2 />} onClick={() => navigate({ name: 'focus' })}>
          Focus mode
        </Button>
      </div>
      {actions.dialogs}
    </section>
  );
}
