import { Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { daysUntil, localToday } from '../../core/dates/deadline.ts';
import { Button, IconButton } from '../../core/ui/components/Button.tsx';
import { Chip } from '../../core/ui/components/Chip.tsx';
import { ConfirmDialog } from '../../core/ui/components/ConfirmDialog.tsx';
import { DeadlineBadge } from '../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../core/ui/components/EmptyState.tsx';
import { ImportanceDots } from '../../core/ui/components/ImportanceDots.tsx';
import { PageHeader } from '../../core/ui/components/PageHeader.tsx';
import { Sheet } from '../../core/ui/components/Sheet.tsx';
import { TextArea, TextField } from '../../core/ui/components/TextField.tsx';
import { useMessages } from '../../core/ui/messages/MessageProvider.tsx';
import styles from './ComponentGallery.module.css';

// Development only (/dev/components): every shared component in its states,
// for checking the look and keyboard behavior by hand.

function addDays(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <div className={styles.row}>{children}</div>
    </section>
  );
}

function EditTitleSheet({ initial, onSave, onClose }: { initial: string; onSave: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState(initial);
  const [notes, setNotes] = useState('');
  return (
    <Sheet
      title="Edit project"
      onClose={onClose}
      onSave={() => onSave(title.trim())}
      onDelete={onClose}
      saveDisabled={title.trim() === ''}
    >
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p className={styles.hint}>Enter in the title saves; Enter in the notes adds a line; Escape discards.</p>
    </Sheet>
  );
}

export default function ComponentGallery() {
  const messages = useMessages();
  const [projectTitle, setProjectTitle] = useState('Rebuild Orbit');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const today = localToday();

  return (
    <div className={styles.gallery}>
      <PageHeader
        title="Components"
        meta={
          <>
            <Chip tone="primary">Active</Chip>
            <Chip color="#1E88E5">Job</Chip>
            <ImportanceDots value={4} />
            <DeadlineBadge deadline={addDays(today, 3)} />
          </>
        }
        actions={
          <>
            <IconButton label="Edit" icon={<Pencil />} />
            <Button variant="primary" icon={<Plus />}>
              New task
            </Button>
          </>
        }
      />

      <Section title="Buttons">
        <Button variant="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger" icon={<Trash2 />}>
          Delete
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <IconButton label="Add" icon={<Plus />} />
        <IconButton label="Delete" icon={<Trash2 />} tooltip="right" />
      </Section>

      <Section title="Text fields">
        <TextField label="Title" placeholder="What needs doing" />
        <TextField label="Lead time" defaultValue="0" error="Enter a number from 1 to 30" />
        <TextArea label="Notes" rows={3} />
      </Section>

      <Section title="Chips">
        <Chip>Backlog</Chip>
        <Chip tone="primary">Active</Chip>
        <Chip tone="secondary">Completed</Chip>
        <Chip tone="amber">Paused</Chip>
        <Chip tone="red">Overdue</Chip>
        <Chip color="#1E88E5">Job</Chip>
        <Chip color="#8E24AA">Personal</Chip>
        <Chip color="#43A047">Sport</Chip>
        <Chip color="#FB8C00">Uni</Chip>
        <Chip tone="primary" onClick={() => messages.show({ text: 'Status chip clicked', kind: 'info' })}>
          Clickable
        </Chip>
      </Section>

      <Section title="Importance">
        {[1, 2, 3, 4, 5].map((n) => (
          <ImportanceDots key={n} value={n} />
        ))}
        <ImportanceDots value={3} inherited />
      </Section>

      <Section title="Deadline badges">
        {[-2, 0, 1, 5, 40].map((days) => (
          <DeadlineBadge key={days} deadline={addDays(today, days)} />
        ))}
        <DeadlineBadge deadline={addDays(today, 6)} inherited />
        <span className={styles.hint}>({daysUntil(addDays(today, 40), today)} days ahead shows the date)</span>
      </Section>

      <Section title="Empty state">
        <div className={styles.wide}>
          <EmptyState
            icon={Inbox}
            text="No tasks yet"
            action={
              <Button variant="primary" icon={<Plus />}>
                New task
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Sheet and dialog">
        <span>
          Project title: <strong>{projectTitle}</strong>
        </span>
        <Button onClick={() => setSheetOpen(true)}>Edit in sheet</Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Delete…
        </Button>
      </Section>

      <Section title="Messages">
        <Button onClick={() => messages.show({ text: 'Work logged' })}>Plain</Button>
        <Button
          onClick={() =>
            messages.show({
              text: 'Task completed',
              action: { label: 'Undo', run: () => messages.show({ text: 'Task reopened', kind: 'info' }) },
            })
          }
        >
          With Undo
        </Button>
        <Button onClick={() => messages.show({ text: 'The server could not be reached', kind: 'error' })}>Error</Button>
      </Section>

      {sheetOpen && (
        <EditTitleSheet
          initial={projectTitle}
          onClose={() => setSheetOpen(false)}
          onSave={(title) => {
            setProjectTitle(title);
            setSheetOpen(false);
            messages.show({ text: 'Project saved' });
          }}
        />
      )}
      {confirmOpen && (
        <ConfirmDialog
          title="Delete project?"
          text="The project and its tasks are deleted."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            messages.show({ text: 'Project deleted' });
          }}
        />
      )}
    </div>
  );
}
