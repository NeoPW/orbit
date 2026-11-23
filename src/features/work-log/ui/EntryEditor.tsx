import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { pathOf } from '../../../core/routing/routes.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { TimeField } from '../../../core/ui/components/TimeField.tsx';
import { blockTimes } from '../../timeline/domain/day-timeline.ts';
import { useOpenTask } from '../../tasks/ui/TaskPopup.tsx';
import { deleteLogEntry, getLogEntry, updateLogEntry, type LogEntry } from '../data/log-repository.ts';
import { editedOccurrence, formatDuration, parseDuration } from '../domain/work-log.ts';
import styles from './EntryEditor.module.css';

const clock = () => new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const clockText = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const EntryEditorContext = createContext<((entryIds: string[]) => void) | null>(null);

/** Opens the editor of a log entry, or the list of stretches to choose from when given several. */
export function useOpenEntryEditor(): (entryIds: string[]) => void {
  const open = useContext(EntryEditorContext);
  if (!open) throw new Error('useOpenEntryEditor() needs an EntryEditorProvider');
  return open;
}

/** Holds the open entry editor and renders it next to the screen. Any navigation closes it. */
export function EntryEditorProvider({ children }: { children: ReactNode }) {
  const path = pathOf(useRoute());
  const [opened, setOpened] = useState<{ ids: string[]; path: string } | null>(null);
  const open = useCallback(
    (ids: string[]) =>
      setOpened({
        ids,
        path: window.location.pathname + window.location.search,
      }),
    [],
  );
  const close = useCallback(() => setOpened(null), []);
  const shown = opened !== null && opened.path === path && opened.ids.length > 0 ? opened : null;
  return (
    <EntryEditorContext.Provider value={open}>
      {children}
      {shown && <EntryEditorHost ids={shown.ids} onClose={close} />}
    </EntryEditorContext.Provider>
  );
}

function EntryEditorHost({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const [chosen, setChosen] = useState<string | null>(ids.length === 1 ? (ids[0] ?? null) : null);
  const data = useLiveQuery(
    async (db) => {
      const entries = await Promise.all(ids.map((id) => getLogEntry(db, id)));
      return {
        entries: entries.filter((e): e is LogEntry => e !== undefined && e.deletedAt === null),
      };
    },
    [ids.join(',')],
  );
  if (!data) return null;
  const entry = data.entries.find((e) => e.id === chosen);
  if (entry) return <EntryForm key={entry.id} entry={entry} onClose={onClose} />;
  if (data.entries.length === 0) return null;
  const stretches = [...data.entries].sort((a, b) => blockTimes(a).start.getTime() - blockTimes(b).start.getTime());
  return (
    <Sheet title="Choose a stretch" onClose={onClose} onSave={onClose} saveLabel="Close">
      <div className={styles.stretches} role="list" aria-label="Stretches">
        {stretches.map((e) => {
          const { start, end } = blockTimes(e);
          return (
            <Button key={e.id} variant="secondary" className={styles.stretch} onClick={() => setChosen(e.id)}>
              {clockText(start)}–{clockText(end)}, {formatDuration(e.durationMinutes ?? 0)}
            </Button>
          );
        })}
      </div>
    </Sheet>
  );
}

function EntryForm({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const { db } = useServices();
  const openTask = useOpenTask();
  const [start, setStart] = useState<string | null>(() => clockText(blockTimes(entry).start));
  const [startValid, setStartValid] = useState(true);
  const [startError, setStartError] = useState<string | undefined>();
  const [duration, setDuration] = useState(entry.durationMinutes === null ? '' : String(entry.durationMinutes));
  const [durationError, setDurationError] = useState<string | undefined>();
  const [note, setNote] = useState(entry.note);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    const parsed = parseDuration(duration);
    if (!parsed.ok) {
      setDurationError(parsed.error);
      return;
    }
    if (!startValid) return;
    if (start === null) {
      setStartError('Enter a time as HH:mm');
      return;
    }
    const when = editedOccurrence(entry, start, parsed.minutes, clock());
    if (!when.ok) {
      setStartError(when.error);
      return;
    }
    await updateLogEntry(db, clock, entry.id, {
      occurredAt: when.at.toISOString(),
      durationMinutes: parsed.minutes,
      note,
    });
    onClose();
  }

  const link = entry.taskId
    ? {
        label: 'Open task',
        open: () => {
          onClose();
          openTask(entry.taskId as string);
        },
      }
    : entry.projectId
      ? {
          label: 'Open project',
          open: () => {
            onClose();
            navigate({ name: 'project', id: entry.projectId as string });
          },
        }
      : entry.goalId
        ? {
            label: 'Open goal',
            open: () => {
              onClose();
              navigate({ name: 'goal', id: entry.goalId as string });
            },
          }
        : null;

  return (
    <>
      <Sheet title="Log entry" onClose={onClose} onSave={() => void save()} onDelete={() => setDeleting(true)}>
        <TimeField
          label="Start time"
          value={start}
          onChange={(value) => {
            setStart(value);
            setStartError(undefined);
          }}
          onValidity={setStartValid}
          error={startError}
        />
        <TextField
          label="Duration (minutes)"
          inputMode="numeric"
          value={duration}
          error={durationError}
          onChange={(event) => {
            setDuration(event.target.value);
            setDurationError(undefined);
          }}
        />
        <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
        {link && (
          <Button variant="secondary" onClick={link.open}>
            {link.label}
          </Button>
        )}
      </Sheet>
      {deleting && (
        <ConfirmDialog
          title="Delete log entry"
          text={entry.source === 'habit' ? 'Delete this entry? The habit check it belongs to is removed too.' : 'Delete this entry?'}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleting(false)}
          onConfirm={() => {
            setDeleting(false);
            void deleteLogEntry(db, clock, entry.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
