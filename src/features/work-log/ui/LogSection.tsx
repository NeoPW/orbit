import { Clock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listEntriesForProject, listEntriesForTask, type LogTarget } from '../data/log-repository.ts';
import { LogEntryList } from './LogEntryList.tsx';
import { LogWorkSheet } from './LogWorkSheet.tsx';

/** The log entries of a project or task, newest first, with "Log work" on that target. */
export function LogSection({ target }: { target: LogTarget }) {
  const key = 'projectId' in target ? target.projectId : target.taskId;
  const entries = useLiveQuery(
    (db) => ('projectId' in target ? listEntriesForProject(db, target.projectId) : listEntriesForTask(db, target.taskId)),
    [key],
  );
  const [logging, setLogging] = useState(false);

  return (
    <Section
      title="Log"
      count={entries?.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setLogging(true)}>
          Log work
        </Button>
      }
    >
      {entries && entries.length === 0 && (
        <EmptyState
          icon={Clock}
          text="No work logged yet"
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => setLogging(true)}>
              Log work
            </Button>
          }
        />
      )}
      {entries && entries.length > 0 && <LogEntryList entries={entries} />}
      {logging && <LogWorkSheet target={target} onClose={() => setLogging(false)} />}
    </Section>
  );
}
