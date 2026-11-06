import { CalendarCheck, ListChecks, Pencil, Repeat, Timer, Trash2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { formatDate } from '../../../core/dates/format.ts';
import type { LogSource } from '../../../core/db/schema.ts';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { deleteLogEntry, type LogEntry } from '../data/log-repository.ts';
import { formatDuration } from '../domain/work-log.ts';
import styles from './LogEntryList.module.css';

const SOURCES: Record<LogSource, { icon: LucideIcon; label: string }> = {
  manual: { icon: Pencil, label: 'Logged by hand' },
  habit: { icon: Repeat, label: 'Habit check' },
  task: { icon: ListChecks, label: 'Task completed' },
  timer: { icon: Timer, label: 'Timer' },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Local `dd-mm-yyyy` and `HH:mm` of an ISO instant. */
function when(occurredAt: string): { date: string; time: string } {
  const d = new Date(occurredAt);
  return {
    date: formatDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const clock = () => new Date();

export interface LogEntryListProps {
  /** Entries in the order to show (newest first). */
  entries: LogEntry[];
  label?: string;
}

/** Log entries as rows: date, time, duration and note, the source as an icon, and delete after confirming. */
export function LogEntryList({ entries, label = 'Log entries' }: LogEntryListProps) {
  const { db } = useServices();
  const [deleting, setDeleting] = useState<LogEntry | null>(null);

  return (
    <div role="list" aria-label={label}>
      {entries.map((entry) => {
        const { date, time } = when(entry.occurredAt);
        const source = SOURCES[entry.source];
        const Icon = source.icon;
        return (
          <div key={entry.id} role="listitem">
            <ListRow
              leading={
                <span className={styles.source} title={source.label} role="img" aria-label={source.label}>
                  <Icon aria-hidden="true" />
                </span>
              }
              title={entry.note || (entry.durationMinutes ? formatDuration(entry.durationMinutes) : 'Work logged')}
              meta={
                <>
                  <span className={styles.when}>
                    <CalendarCheck aria-hidden="true" /> {date} {time}
                  </span>
                  {entry.durationMinutes !== null && entry.note && <span>{formatDuration(entry.durationMinutes)}</span>}
                </>
              }
              trailing={<IconButton label="Delete entry" icon={<Trash2 />} onClick={() => setDeleting(entry)} />}
            />
          </div>
        );
      })}
      {deleting && (
        <ConfirmDialog
          title="Delete log entry"
          text={deleting.source === 'habit' ? 'Delete this entry? The habit check it belongs to is removed too.' : 'Delete this entry?'}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const id = deleting.id;
            setDeleting(null);
            void deleteLogEntry(db, clock, id);
          }}
        />
      )}
    </div>
  );
}
