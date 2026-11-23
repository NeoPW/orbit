import { ArrowDown, ArrowUp, Check, Dumbbell, EllipsisVertical, Flag, Replace, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { localToday } from '../../../core/dates/deadline.ts';
import { formatDate } from '../../../core/dates/format.ts';
import { useNow } from '../../../core/dates/today.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { DateField } from '../../../core/ui/components/DateField.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { Select } from '../../../core/ui/components/Select.tsx';
import { Sheet } from '../../../core/ui/components/Sheet.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import fieldStyles from '../../../core/ui/components/TextField.module.css';
import { TimeField } from '../../../core/ui/components/TimeField.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { formatDuration } from '../../work-log/domain/work-log.ts';
import { listExercises, type Exercise } from '../data/exercises-repository.ts';
import {
  addSessionExercise,
  deleteSession,
  deleteSet,
  discardSession,
  finishSession,
  getSession,
  loadLastTimeRows,
  logSet,
  moveSessionExercise,
  removeSessionExercise,
  renameSession,
  replaceSessionExercise,
  updateFinishedSession,
  updateSet,
  type SessionExerciseView,
  type SessionSet,
  type WorkoutSession,
} from '../data/sessions-repository.ts';
import { clockTime, formatSet, lastTime, localInstant, pace, prefill, runningMinutes, toInput, type LastTime, type SetInput } from '../domain/sessions.ts';
import styles from './SessionScreen.module.css';

const clock = () => new Date();
const toWorkouts = () => navigate({ name: 'workouts' });

async function loadSession(db: Db, id: string) {
  const view = await getSession(db, id);
  if (!view) return { view: undefined, lastRows: [], exercises: [] as Exercise[] };
  const [lastRows, exercises] = await Promise.all([
    loadLastTimeRows(
      db,
      view.exercises.map((e) => e.exerciseId),
      id,
    ),
    listExercises(db),
  ]);
  return { view, lastRows, exercises };
}

/** One set as text, with the pace for endurance. */
function setText(exercise: SessionExerciseView, set: SessionSet | LastTime['sets'][number]): string {
  const text = formatSet(exercise.kind, set, exercise.distanceUnit);
  if (exercise.kind !== 'endurance' || !set.distance || !set.durationSeconds) return text;
  return `${text} · ${pace(set.distance, set.durationSeconds, exercise.distanceUnit ?? 'km')}`;
}

/** The inputs of one set for the exercise's kind. */
function SetFields({ exercise, value, onChange }: { exercise: SessionExerciseView; value: SetInput; onChange: (value: SetInput) => void }) {
  if (exercise.kind === 'endurance') {
    return (
      <>
        <TextField
          label={`Distance (${exercise.distanceUnit ?? 'km'})`}
          inputMode="decimal"
          value={value.distance}
          onChange={(e) => onChange({ ...value, distance: e.target.value })}
        />
        <TextField label="Time" placeholder="m:ss" inputMode="numeric" value={value.duration} onChange={(e) => onChange({ ...value, duration: e.target.value })} />
      </>
    );
  }
  return (
    <>
      <TextField label="Reps" inputMode="numeric" value={value.reps} onChange={(e) => onChange({ ...value, reps: e.target.value })} />
      {exercise.kind === 'strength' && (
        <TextField label="Weight (kg)" inputMode="decimal" value={value.weight} onChange={(e) => onChange({ ...value, weight: e.target.value })} />
      )}
    </>
  );
}

/** The input row of the next set, filled in from last time or the last logged set. Remounted after each logged set. */
function NextSet({ exercise, last }: { exercise: SessionExerciseView; last: LastTime | null }) {
  const { db } = useServices();
  const [value, setValue] = useState<SetInput>(() => toInput(prefill(last?.sets ?? [], exercise.sets)));
  const [error, setError] = useState<string | null>(null);

  async function log() {
    const result = await logSet(db, clock, exercise.id, value);
    if (!result.ok) setError(result.error);
  }

  return (
    <form
      className={styles.next}
      onSubmit={(event) => {
        event.preventDefault();
        void log();
      }}
    >
      <div className={styles.fields}>
        <SetFields
          exercise={exercise}
          value={value}
          onChange={(v) => {
            setValue(v);
            setError(null);
          }}
        />
      </div>
      {error && <p className={fieldStyles.error}>{error}</p>}
      <Button type="submit" icon={<Check />} className={styles.logButton}>
        Log set
      </Button>
    </form>
  );
}

/** Edits or deletes one logged set. */
function SetSheet({ exercise, set, onClose }: { exercise: SessionExerciseView; set: SessionSet; onClose: () => void }) {
  const { db } = useServices();
  const [value, setValue] = useState<SetInput>(() => toInput(set));
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const result = await updateSet(db, clock, set.id, value);
    if (!result.ok) return setError(result.error);
    onClose();
  }

  return (
    <Sheet title={`Set of ${exercise.name}`} onClose={onClose} onSave={() => void save()} onDelete={() => void deleteSet(db, clock, set.id).then(onClose)}>
      <SetFields
        exercise={exercise}
        value={value}
        onChange={(v) => {
          setValue(v);
          setError(null);
        }}
      />
      {error && <p className={fieldStyles.error}>{error}</p>}
    </Sheet>
  );
}

interface CardProps {
  exercise: SessionExerciseView;
  last: LastTime | null;
  first: boolean;
  lastInList: boolean;
  /** Exercises that can take this one's place (or be added). */
  others: Exercise[];
}

function ExerciseCard({ exercise, last, first, lastInList, others }: CardProps) {
  const { db } = useServices();
  const [editing, setEditing] = useState<SessionSet | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [removing, setRemoving] = useState(false);
  const remove = () => void removeSessionExercise(db, clock, exercise.id);
  const canReplace = exercise.sets.length === 0 && others.length > 0;

  return (
    <Tile aria-label={exercise.name}>
      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{exercise.name}</h2>
          <Menu
            label={`Change ${exercise.name}`}
            trigger={(props) => <IconButton label={`Change ${exercise.name}`} tooltip="none" icon={<EllipsisVertical />} className={styles.touch} {...props} />}
            items={[
              { label: 'Move up', icon: <ArrowUp />, disabled: first, onSelect: () => void moveSessionExercise(db, clock, exercise.id, -1) },
              { label: 'Move down', icon: <ArrowDown />, disabled: lastInList, onSelect: () => void moveSessionExercise(db, clock, exercise.id, 1) },
              ...(canReplace ? [{ label: 'Replace', icon: <Replace />, onSelect: () => setReplacing(true) }] : []),
              { label: 'Remove', icon: <X />, danger: true, onSelect: () => (exercise.sets.length > 0 ? setRemoving(true) : remove()) },
            ]}
          />
        </header>
        {last && (
          <p className={styles.last}>
            Last time {formatDate(localToday(new Date(last.startedAt)))}: {last.sets.map((s) => setText(exercise, s)).join(', ')}
          </p>
        )}
        {exercise.sets.length > 0 && (
          <ol className={styles.sets}>
            {exercise.sets.map((set, index) => (
              <li key={set.id}>
                <button type="button" className={styles.set} onClick={() => setEditing(set)}>
                  <span className={styles.setNumber}>{index + 1}</span>
                  <span>{setText(exercise, set)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {!exercise.deleted && <NextSet key={exercise.sets.length} exercise={exercise} last={last} />}
        {editing && <SetSheet exercise={exercise} set={editing} onClose={() => setEditing(null)} />}
        {replacing && (
          <Sheet
            title={`Replace ${exercise.name}`}
            onClose={() => setReplacing(false)}
            onSave={() => {
              if (!replacement) return;
              void replaceSessionExercise(db, clock, exercise.id, replacement).then(() => setReplacing(false));
            }}
            saveLabel="Replace"
            saveDisabled={!replacement}
          >
            <Select label="Exercise" value={replacement} onChange={setReplacement} options={[{ value: '', label: 'Choose…' }, ...others.map((e) => ({ value: e.id, label: e.name }))]} />
          </Sheet>
        )}
        {removing && (
          <ConfirmDialog
            title="Remove exercise"
            text={`Remove ${exercise.name} and its ${exercise.sets.length === 1 ? 'set' : `${exercise.sets.length} sets`} from this session?`}
            confirmLabel="Remove"
            danger
            onCancel={() => setRemoving(false)}
            onConfirm={() => {
              setRemoving(false);
              remove();
            }}
          />
        )}
      </div>
    </Tile>
  );
}

/** The running time, counting live. */
function RunningTime({ startedAt }: { startedAt: string }) {
  const now = useNow(15000);
  return (
    <p className={styles.status}>
      Running since {clockTime(startedAt)} · {formatDuration(runningMinutes(startedAt, now))}
    </p>
  );
}

/** Date, start and end of a finished session; saved together, also correcting its log entry. */
function FinishedTimes({ session }: { session: WorkoutSession }) {
  const { db } = useServices();
  const [date, setDate] = useState<string | null>(localToday(new Date(session.startedAt)));
  const [start, setStart] = useState<string | null>(clockTime(session.startedAt));
  const [end, setEnd] = useState<string | null>(clockTime(session.endedAt ?? session.startedAt));
  const [valid, setValid] = useState({ date: true, start: true, end: true });
  const [error, setError] = useState<string | null>(null);
  const changed = date !== localToday(new Date(session.startedAt)) || start !== clockTime(session.startedAt) || end !== clockTime(session.endedAt ?? session.startedAt);
  const ready = changed && date && start && end && valid.date && valid.start && valid.end;

  async function save() {
    if (!date || !start || !end) return;
    const result = await updateFinishedSession(db, clock, session.id, { name: session.name, startedAt: localInstant(date, start), endedAt: localInstant(date, end) });
    setError(result.ok ? null : result.error);
  }

  return (
    <div className={styles.times}>
      <DateField label="Date" value={date} onChange={setDate} onValidity={(ok) => setValid((v) => ({ ...v, date: ok }))} />
      <div className={styles.fields}>
        <TimeField label="Start" value={start} onChange={setStart} onValidity={(ok) => setValid((v) => ({ ...v, start: ok }))} />
        <TimeField label="End" value={end} onChange={setEnd} onValidity={(ok) => setValid((v) => ({ ...v, end: ok }))} />
      </div>
      {error && <p className={fieldStyles.error}>{error}</p>}
      {changed && (
        <Button variant="primary" disabled={!ready} onClick={() => void save()}>
          Save times
        </Button>
      )}
    </div>
  );
}

/** A workout session on the phone: running (log sets, finish or discard) or finished (edit or delete). */
export function SessionScreen() {
  const route = useRoute();
  const id = route.name === 'workout-session' ? route.id : '';
  const { db } = useServices();
  const data = useLiveQuery((database) => loadSession(database, id), [id]);
  const [name, setName] = useState<string | null>(null);
  const [adding, setAdding] = useState('');
  const [confirm, setConfirm] = useState<'finish' | 'discard' | 'delete' | null>(null);

  if (!data) return null;
  const { view } = data;
  if (!view) {
    return (
      <EmptyState
        icon={Dumbbell}
        text="This session no longer exists"
        action={
          <Button variant="primary" onClick={toWorkouts}>
            Workouts
          </Button>
        }
      />
    );
  }
  const { session } = view;
  const running = session.endedAt === null;
  const inSession = new Set(view.exercises.map((e) => e.exerciseId));
  const addable = data.exercises.filter((e) => !inSession.has(e.id));

  return (
    <div className={styles.screen}>
      <TextField
        label="Name"
        value={name ?? session.name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name !== null) void renameSession(db, clock, session.id, name);
          setName(null);
        }}
      />
      {running ? <RunningTime startedAt={session.startedAt} /> : <FinishedTimes key={`${session.startedAt}-${session.endedAt}`} session={session} />}

      {view.exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          last={lastTime(exercise.exerciseId, data.lastRows)}
          first={index === 0}
          lastInList={index === view.exercises.length - 1}
          others={addable}
        />
      ))}

      <Select
        label="Add exercise"
        value={adding}
        onChange={(exerciseId) => {
          setAdding('');
          if (exerciseId) void addSessionExercise(db, clock, session.id, exerciseId);
        }}
        options={[{ value: '', label: addable.length === 0 ? 'No more exercises' : 'Choose…' }, ...addable.map((e) => ({ value: e.id, label: e.name }))]}
      />

      <div className={styles.footer}>
        {running ? (
          <>
            <Button variant="ghost" icon={<Trash2 />} onClick={() => setConfirm('discard')}>
              Discard
            </Button>
            <Button variant="primary" icon={<Flag />} onClick={() => setConfirm('finish')}>
              Finish
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon={<Trash2 />} onClick={() => setConfirm('delete')}>
              Delete
            </Button>
            <Button onClick={toWorkouts}>Done</Button>
          </>
        )}
      </div>

      {confirm === 'finish' && (
        <ConfirmDialog
          title="Finish workout"
          text={`Finish "${session.name}"? Its time is logged as work.`}
          confirmLabel="Finish"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void finishSession(db, clock, session.id).then(toWorkouts);
          }}
        />
      )}
      {confirm === 'discard' && (
        <ConfirmDialog
          title="Discard workout"
          text={`Discard "${session.name}" and its sets? Nothing is logged.`}
          confirmLabel="Discard"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void discardSession(db, clock, session.id).then(toWorkouts);
          }}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Delete workout"
          text={`Delete "${session.name}", its sets and its logged time?`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            void deleteSession(db, clock, session.id).then(toWorkouts);
          }}
        />
      )}
    </div>
  );
}
