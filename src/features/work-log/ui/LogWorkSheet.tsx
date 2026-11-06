import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TimeField } from '../../../core/ui/components/TimeField.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { addManualEntry, listAllEntries, listLogTargets, type LogTarget } from '../data/log-repository.ts';
import { lastLoggedBy, occurrenceTime, parseDuration, recentFirst } from '../domain/work-log.ts';
import styles from './LogWorkSheet.module.css';

export type { LogTarget };

const clock = () => new Date();

/**
 * Log work by hand: duration (minutes) and note, on `target`. Without a target the sheet lists the active
 * projects and open tasks outside projects, recently used first; choosing one saves.
 */
export function LogWorkSheet({ target, onClose }: { target?: LogTarget; onClose: () => void }) {
  const { db } = useServices();
  const messages = useMessages();
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [startValid, setStartValid] = useState(true);
  const [startError, setStartError] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();
  const choices = useLiveQuery(
    async (database) => {
      if (target) return { projects: [], tasks: [] };
      const [targets, entries] = await Promise.all([listLogTargets(database), listAllEntries(database)]);
      return {
        projects: recentFirst(targets.projects, lastLoggedBy(entries, 'projectId')),
        tasks: recentFirst(targets.tasks, lastLoggedBy(entries, 'taskId')),
      };
    },
    [target === undefined],
  );

  async function save(chosen: LogTarget | undefined) {
    if (!chosen) return;
    const parsed = parseDuration(duration);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (!startValid) return;
    const when = occurrenceTime(startTime, parsed.minutes, clock());
    if (!when.ok) {
      setStartError(when.error);
      return;
    }
    await addManualEntry(db, clock, { target: chosen, durationMinutes: parsed.minutes, note, occurredAt: when.at });
    messages.show({ text: 'Work logged' });
    onClose();
  }

  return (
    <Sheet title="Log work" onClose={onClose} onSave={() => void save(target)} saveDisabled={!target}>
      <TextField
        label="Duration (minutes)"
        inputMode="numeric"
        value={duration}
        error={error}
        onChange={(event) => {
          setDuration(event.target.value);
          setError(undefined);
        }}
      />
      <TimeField
        label="Start time"
        value={startTime}
        onChange={(value) => {
          setStartTime(value);
          setStartError(undefined);
        }}
        onValidity={setStartValid}
        error={startError}
      />
      <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
      {!target && choices && (
        <>
          {choices.projects.length > 0 && (
            <ChoiceGroup title="Projects" items={choices.projects} onChoose={(id) => void save({ projectId: id })} />
          )}
          {choices.tasks.length > 0 && <ChoiceGroup title="Tasks" items={choices.tasks} onChoose={(id) => void save({ taskId: id })} />}
          {choices.projects.length === 0 && choices.tasks.length === 0 && <p className={styles.none}>No active projects or open tasks</p>}
        </>
      )}
    </Sheet>
  );
}

function ChoiceGroup({
  title,
  items,
  onChoose,
}: {
  title: string;
  items: { id: string; title: string }[];
  onChoose: (id: string) => void;
}) {
  return (
    <div className={styles.group} role="group" aria-label={title}>
      <h3>{title}</h3>
      {items.map((item) => (
        <button key={item.id} type="button" className={styles.choice} onClick={() => onChoose(item.id)}>
          {item.title}
        </button>
      ))}
    </div>
  );
}
