import { Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { daysUntil, localToday } from '../../core/dates/deadline.ts';
import { addDays } from '../../core/dates/today.ts';
import { AREA_COLORS, GOAL_COLORS } from '../../core/ui/palette.ts';
import { AnimatedList } from '../../core/ui/components/AnimatedList.tsx';
import { Button, IconButton } from '../../core/ui/components/Button.tsx';
import { Checkbox } from '../../core/ui/components/Checkbox.tsx';
import { Chip } from '../../core/ui/components/Chip.tsx';
import { ColorPicker } from '../../core/ui/components/ColorPicker.tsx';
import { ConfirmDialog } from '../../core/ui/components/ConfirmDialog.tsx';
import { DateField } from '../../core/ui/components/DateField.tsx';
import { DeadlineBadge } from '../../core/ui/components/DeadlineBadge.tsx';
import { EmptyState } from '../../core/ui/components/EmptyState.tsx';
import { ImportanceDots } from '../../core/ui/components/ImportanceDots.tsx';
import { ListRow } from '../../core/ui/components/ListRow.tsx';
import { Menu } from '../../core/ui/components/Menu.tsx';
import { NumberField } from '../../core/ui/components/NumberField.tsx';
import { PageHeader } from '../../core/ui/components/PageHeader.tsx';
import { ProgressBar } from '../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../core/ui/components/Section.tsx';
import { SegmentedControl } from '../../core/ui/components/SegmentedControl.tsx';
import { Select } from '../../core/ui/components/Select.tsx';
import { Sheet } from '../../core/ui/components/Sheet.tsx';
import { Switch } from '../../core/ui/components/Switch.tsx';
import { TextArea, TextField } from '../../core/ui/components/TextField.tsx';
import { TimeField } from '../../core/ui/components/TimeField.tsx';
import { WeekdayPicker } from '../../core/ui/components/WeekdayPicker.tsx';
import { useMessages } from '../../core/ui/messages/MessageProvider.tsx';
import styles from './ComponentGallery.module.css';

// Development only (/dev/components): every shared component in its states,
// for checking the look and keyboard behavior by hand.

function Block({ title, children }: { title: string; children: ReactNode }) {
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
  const [date, setDate] = useState<string | null>('2026-11-30');
  const [time, setTime] = useState<string | null>('07:15');
  const [amount, setAmount] = useState<number | null>(12.5);
  const [assignment, setAssignment] = useState('');
  const [reminders, setReminders] = useState(true);
  const [done, setDone] = useState(false);
  const [length, setLength] = useState<number>(25);
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [areaColor, setAreaColor] = useState<string | null>(AREA_COLORS[0]);
  const [goalColor, setGoalColor] = useState<string | null>(null);
  const [status, setStatus] = useState('Active');
  const [rows, setRows] = useState(['Write outline', 'Book flights', 'Call the bank']);
  const [counter, setCounter] = useState(1);

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

      <Block title="Buttons">
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
      </Block>

      <Block title="Text fields">
        <TextField label="Title" placeholder="What needs doing" />
        <TextField label="Lead time" defaultValue="0" error="Enter a number from 1 to 30" />
        <TextArea label="Notes" rows={3} />
      </Block>

      <Block title="Chips">
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
      </Block>

      <Block title="Importance">
        {[1, 2, 3, 4, 5].map((n) => (
          <ImportanceDots key={n} value={n} />
        ))}
        <ImportanceDots value={3} inherited />
      </Block>

      <Block title="Deadline badges">
        {[-2, 0, 1, 5, 40].map((days) => (
          <DeadlineBadge key={days} deadline={addDays(today, days)} />
        ))}
        <DeadlineBadge deadline={addDays(today, 6)} inherited />
        <span className={styles.hint}>({daysUntil(addDays(today, 40), today)} days ahead shows the date)</span>
      </Block>

      <Block title="Date and time fields">
        <DateField label="Deadline" value={date} onChange={setDate} />
        <TimeField label="Reminder" value={time} onChange={setTime} />
        <span className={styles.hint}>
          Value: {date ?? 'empty'} / {time ?? 'empty'}. Type 31-02-2026 and leave the field to see the error.
        </span>
      </Block>

      <Block title="Number, select and choices">
        <NumberField label="Target" value={amount} onChange={setAmount} inputMode="decimal" />
        <Select
          label="Assign to"
          value={assignment}
          onChange={setAssignment}
          options={[
            { value: '', label: 'None' },
            { group: 'Goals', options: [{ value: 'g1', label: 'Get fit' }, { value: 'g2', label: 'Learn Rust' }] },
            { group: 'Projects', options: [{ value: 'p1', label: 'Thesis' }] },
          ]}
        />
        <Switch label="Reminders" checked={reminders} onChange={setReminders} />
        <Checkbox label="Done" checked={done} onChange={setDone} />
        <SegmentedControl
          label="Focus length"
          options={[
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 90, label: '90' },
          ]}
          value={length}
          onChange={setLength}
        />
        <WeekdayPicker value={days} onChange={setDays} />
      </Block>

      <Block title="Color pickers">
        <ColorPicker label="Area color" colors={AREA_COLORS} value={areaColor} onChange={setAreaColor} />
        <ColorPicker label="Goal color" colors={GOAL_COLORS} value={goalColor} onChange={setGoalColor} allowAuto />
      </Block>

      <Block title="Menu">
        <Menu
          label="Status"
          trigger={(props) => (
            <Chip tone="primary" onClick={props.onClick} aria-haspopup={props['aria-haspopup']} aria-expanded={props['aria-expanded']}>
              {status}
            </Chip>
          )}
          items={['Active', 'Paused', 'Backlog', 'Completed'].map((label) => ({ label, checked: label === status, onSelect: () => setStatus(label) }))}
        />
        <Menu
          label="More actions"
          trigger={(props) => <IconButton label="More actions" icon={<MoreHorizontal />} {...props} />}
          items={[
            { label: 'Edit', icon: <Pencil />, onSelect: () => messages.show({ text: 'Edit chosen' }) },
            { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => messages.show({ text: 'Delete chosen' }) },
          ]}
        />
      </Block>

      <Block title="Progress, rows and sections">
        <div className={styles.wide}>
          <ProgressBar label="Run 100 km" value={0.45} color={GOAL_COLORS[0]} />
          <ProgressBar label="Read 12 books" value={1} color={GOAL_COLORS[3]} />
          <Section title="Tasks" count={rows.length} actions={<Button icon={<Plus />} onClick={() => { setRows([...rows, `New task ${counter}`]); setCounter(counter + 1); }}>Add</Button>}>
            <AnimatedList
              label="Tasks"
              items={rows}
              getKey={(row) => row}
              renderItem={(row) => (
                <ListRow
                  leading={<Checkbox label="" checked={false} onChange={() => setRows(rows.filter((r) => r !== row))} />}
                  title={row}
                  meta={<DeadlineBadge deadline={addDays(today, 2)} />}
                  onOpen={() => messages.show({ text: `Open ${row}` })}
                  trailing={<IconButton label="Delete" icon={<Trash2 />} onClick={() => setRows(rows.filter((r) => r !== row))} />}
                />
              )}
            />
          </Section>
        </div>
      </Block>

      <Block title="Empty state">
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
      </Block>

      <Block title="Sheet and dialog">
        <span>
          Project title: <strong>{projectTitle}</strong>
        </span>
        <Button onClick={() => setSheetOpen(true)}>Edit in sheet</Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Delete…
        </Button>
      </Block>

      <Block title="Messages">
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
      </Block>

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
