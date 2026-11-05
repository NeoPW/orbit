import { Focus, Maximize2, Play, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Select, type SelectGroup } from '../../../core/ui/components/Select.tsx';
import { useSettings } from '../../settings/data/settings.ts';
import type { ActiveProjectItem, TodoItem } from '../../home/data/home-queries.ts';
import type { LogTarget } from '../../work-log/data/log-repository.ts';
import { getTimerView, type TimerView } from '../data/timer-view.ts';
import styles from './FocusPanel.module.css';
import { TimerReadout } from './TimerReadout.tsx';
import { useStartFocus } from './useStartFocus.ts';
import { useStopTimer } from './useStopTimer.tsx';

/** Planned lengths in minutes; 0 stands for open-ended. */
const LENGTHS = [
  { value: 25, label: '25 min' },
  { value: 50, label: '50 min' },
  { value: 90, label: '90 min' },
  { value: 0, label: 'Open-ended' },
];

export interface FocusPanelProps {
  /** The To do tasks and the active projects to choose from. */
  todo: TodoItem[];
  projects: ActiveProjectItem[];
}

/** Home's focus panel: choose and start a session, or the running one with Stop, Discard and Focus mode. */
export function FocusPanel({ todo, projects }: FocusPanelProps) {
  const view = useLiveQuery(getTimerView, []);
  if (view === undefined) return <section className={styles.panel} aria-label="Focus" />;
  return view ? <Running view={view} /> : <Idle todo={todo} projects={projects} />;
}

function Idle({ todo, projects }: FocusPanelProps) {
  const { settings } = useSettings();
  const { start } = useStartFocus();
  const [choice, setChoice] = useState('');
  const [minutes, setMinutes] = useState<number | null>(null);
  const length = minutes ?? (LENGTHS.some((l) => l.value === settings.focusMinutes) ? settings.focusMinutes : 25);

  const options: (SelectGroup | { value: string; label: string })[] = [
    { value: '', label: 'Choose what to work on' },
    ...(todo.length ? [{ group: 'To do', options: todo.map((t) => ({ value: `task:${t.task.id}`, label: t.task.title })) }] : []),
    ...(projects.length ? [{ group: 'Projects', options: projects.map((p) => ({ value: `project:${p.view.project.id}`, label: p.view.project.title })) }] : []),
  ];

  function begin() {
    const [kind, id] = choice.split(':');
    if (!id) return;
    const target: LogTarget = kind === 'task' ? { taskId: id } : { projectId: id };
    void start(target, length === 0 ? null : length);
  }

  return (
    <section className={styles.panel} aria-label="Focus">
      <h2 className={styles.heading}>
        <Focus aria-hidden="true" /> Focus
      </h2>
      <div className={styles.row}>
        <div className={styles.choose}>
          <Select label="Work on" value={choice} onChange={setChoice} options={options} />
        </div>
        <SegmentedControl label="Planned length" options={LENGTHS} value={length} onChange={setMinutes} />
        <Button variant="primary" icon={<Play />} disabled={choice === ''} onClick={begin}>
          Start
        </Button>
      </div>
    </section>
  );
}

function Running({ view }: { view: TimerView }) {
  const stop = useStopTimer(view);
  const { timer } = view;
  return (
    <section className={styles.panel} aria-label="Focus">
      <div className={styles.running}>
        <div className={styles.what}>
          <span className={styles.title}>{view.title}</span>
          <TimerReadout startedAt={timer.startedAt} plannedMinutes={timer.plannedMinutes} />
        </div>
        <div className={styles.actions}>
          <Button variant="primary" icon={<Square />} onClick={stop.askStop}>
            Stop
          </Button>
          <Button variant="ghost" icon={<Trash2 />} onClick={stop.askDiscard}>
            Discard
          </Button>
          <Button icon={<Maximize2 />} onClick={() => navigate({ name: 'focus' })}>
            Focus mode
          </Button>
        </div>
      </div>
      {stop.dialogs}
    </section>
  );
}
