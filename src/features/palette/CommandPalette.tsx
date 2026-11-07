import { Search } from 'lucide-react';
import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useServices } from '../../app/services.ts';
import { useOpenAppSheet } from '../../app/shortcuts/AppSheets.tsx';
import { SHORTCUTS } from '../../app/shortcuts/keys.ts';
import { focusModeRequest } from '../../app/shortcuts/requests.ts';
import { useLiveQuery } from '../../core/db/live.ts';
import { notDeleted } from '../../core/db/records.ts';
import { goals, projects } from '../../core/db/schema.ts';
import { navigate } from '../../core/routing/useRoute.ts';
import { projectColor } from '../../core/ui/colors.ts';
import { useMessages } from '../../core/ui/messages/MessageProvider.tsx';
import { THEMES } from '../../core/ui/themes.ts';
import type { Db } from '../../core/db/drizzle.ts';
import { listActiveHabitOptions } from '../home/data/home-queries.ts';
import { useSettings } from '../settings/data/settings.ts';
import { useSync } from '../sync/ui/SyncRunner.tsx';
import { createTask, listOpenTasks } from '../tasks/data/tasks-repository.ts';
import { getTimer, pauseTimer, resumeTimer } from '../timer/data/timer-repository.ts';
import { quickStartPlan, type QuickProject, type QuickTask } from '../timer/domain/quick-start.ts';
import { useStartFocus } from '../timer/ui/useStartFocus.ts';
import { buildEntries, filterEntries, type PaletteCommand, type PaletteData, type PaletteEntry } from './entries.ts';
import styles from './CommandPalette.module.css';

const clock = () => new Date();

interface Loaded {
  data: Omit<PaletteData, 'themes' | 'syncConnected'>;
  /** For "Focus: <text>", read like Home's focus field. */
  quickTasks: QuickTask[];
  quickProjects: QuickProject[];
}

async function loadPalette(db: Db): Promise<Loaded> {
  const [projectRows, goalRows, openTasks, habits, timer] = await Promise.all([
    db.select().from(projects).where(notDeleted(projects)).orderBy(projects.title),
    db.select().from(goals).where(notDeleted(goals)).orderBy(goals.title),
    listOpenTasks(db),
    listActiveHabitOptions(db),
    getTimer(db),
  ]);
  return {
    data: {
      projects: projectRows.map((p) => ({ id: p.id, title: p.title, active: p.status === 'active', color: projectColor(p) })),
      goals: goalRows.map((g) => ({ id: g.id, title: g.title })),
      openTasks: openTasks.map((v) => ({ id: v.task.id, title: v.task.title, color: v.projectColor })),
      activeHabits: habits.map((h) => ({ id: h.id, title: h.title, color: h.projectColor })),
      session: timer ? { paused: timer.pausedAt !== null } : null,
    },
    quickTasks: [
      ...openTasks.map((v) => ({ id: v.task.id, title: v.task.title, projectId: v.task.projectId, kind: 'task' as const })),
      ...habits.map((h) => ({ id: h.id, title: h.title, projectId: h.projectId, kind: 'habit' as const })),
    ],
    quickProjects: projectRows.filter((p) => p.status === 'active').map((p) => ({ id: p.id, title: p.title })),
  };
}

const keysOf = (entry: PaletteEntry) => (entry.shortcut ? SHORTCUTS.find((s) => s.action === entry.shortcut)?.keys : undefined);

/** `Ctrl+K`: type to filter, arrows to move, Enter or a click to run, Esc to close. Render it only while it is open. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { db } = useServices();
  const loaded = useLiveQuery(loadPalette, []);
  const { connected, syncNow } = useSync();
  const { save } = useSettings();
  const openSheet = useOpenAppSheet();
  const { start } = useStartFocus();
  const messages = useMessages();
  const ref = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector('input')?.focus();
    return () => dialog.close();
  }, []);

  const entries = useMemo(() => {
    if (!loaded) return [];
    const all = buildEntries({ ...loaded.data, themes: THEMES.map((t) => ({ id: t.id, name: t.name })), syncConnected: connected });
    return filterEntries(all, query);
  }, [loaded, connected, query]);
  const current = Math.min(active, Math.max(0, entries.length - 1));

  async function run(command: PaletteCommand) {
    onClose();
    switch (command.type) {
      case 'sheet':
        return openSheet(command.sheet);
      case 'screen':
        return navigate({ name: command.screen });
      case 'page':
        return navigate({ name: command.page, id: command.id });
      case 'focus':
        return start(command.target);
      case 'focus-text': {
        if (!loaded) return;
        const plan = quickStartPlan(command.text, loaded.quickTasks, loaded.quickProjects);
        if (plan.kind === 'error') return messages.show({ text: plan.message });
        if (plan.kind === 'task') return start({ taskId: plan.taskId });
        if (plan.kind === 'habit') return start({ habitId: plan.habitId });
        if (plan.kind === 'project') return start({ projectId: plan.projectId });
        if (plan.kind === 'new') {
          const taskId = await createTask(db, clock, {
            title: plan.title,
            notes: '',
            dueDate: null,
            importance: null,
            projectId: plan.projectId,
            goalId: null,
          });
          return start({ taskId });
        }
        return;
      }
      case 'session':
        if (command.action === 'pause') return pauseTimer(db, clock);
        if (command.action === 'resume') return resumeTimer(db, clock);
        navigate({ name: 'focus' });
        return focusModeRequest.request(command.action);
      case 'theme':
        return void save('theme', command.theme as (typeof THEMES)[number]['id']);
      case 'sync':
        return syncNow();
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (entries.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current + step + entries.length) % entries.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = entries[current];
      if (entry) void run(entry.command);
    }
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label="Command palette"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop closes it.
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={styles.search}>
        <Search aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="Search commands"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={entries[current] ? `${listId}-${entries[current].id}` : undefined}
          placeholder="Type a command, a title, or what to focus on"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div id={listId} role="listbox" aria-label="Commands" className={styles.list}>
        {entries.map((entry, index) => {
          const keys = keysOf(entry);
          return (
            <div
              key={entry.id}
              id={`${listId}-${entry.id}`}
              role="option"
              aria-selected={index === current}
              className={styles.option}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => void run(entry.command)}
              ref={index === current ? (node) => node?.scrollIntoView({ block: 'nearest' }) : undefined}
            >
              <span className={styles.kind}>{entry.kind}</span>
              {entry.color && <span className={styles.dot} style={{ '--dot': entry.color } as CSSProperties} aria-hidden="true" />}
              <span className={styles.label}>{entry.label}</span>
              {keys && <kbd className={styles.kbd}>{keys}</kbd>}
            </div>
          );
        })}
        {loaded && entries.length === 0 && <p className={styles.empty}>Nothing found</p>}
      </div>
    </dialog>
  );
}
