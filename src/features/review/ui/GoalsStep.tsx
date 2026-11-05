import { Minus, Plus, Target } from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { GoalStatus } from '../../../core/db/schema.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { IconButton } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { goalColor } from '../../../core/ui/palette.ts';
import { getGoal, listActiveGoals, setGoalStatus, type GoalWithMeasures, type MeasureView } from '../../goals/data/goals-repository.ts';
import { setMeasureDone, setMeasureValue, stepMeasure } from '../../goals/data/measures-repository.ts';
import { goalProgress, measureProgress, measureValueText } from '../../goals/domain/goals.ts';
import { NoteField } from '../../notes/ui/NoteField.tsx';
import styles from './ReviewFlow.module.css';

const clock = () => new Date();
const STATUSES: { status: GoalStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
  { status: 'archived', label: 'Archived' },
];
const STATUS_TONE = { active: 'primary', completed: 'secondary', archived: 'neutral' } as const;

/** The value of a numeric measure; typing is kept locally and applied on Enter or when the field loses focus. */
function ValueInput({ measure }: { measure: MeasureView }) {
  const { db } = useServices();
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const value = Number(text.trim().replace(',', '.'));
    if (text.trim() !== '' && Number.isFinite(value) && value !== measure.currentValue) void setMeasureValue(db, clock, measure.id, value);
    setText(null);
  };
  return (
    <input
      className={styles.valueInput}
      aria-label={`Value of ${measure.title}`}
      inputMode="decimal"
      value={text ?? String(measure.currentValue ?? 0)}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}

function MeasureRow({ measure, color }: { measure: MeasureView; color: string }) {
  const { db } = useServices();
  return (
    <ListRow
      title={measure.title}
      meta={<ProgressBar value={measureProgress(measure, measure.checkIns)} color={color} label={measure.title} />}
      trailing={
        measure.measureType === 'numeric' ? (
          <>
            <IconButton label={`Lower ${measure.title}`} icon={<Minus />} onClick={() => void stepMeasure(db, clock, measure.id, -1)} />
            <ValueInput measure={measure} />
            <span className={styles.target}>
              / {measure.targetValue ?? 0}
              {measure.unit ? ` ${measure.unit}` : ''}
            </span>
            <IconButton label={`Raise ${measure.title}`} icon={<Plus />} onClick={() => void stepMeasure(db, clock, measure.id, 1)} />
          </>
        ) : measure.measureType === 'boolean' ? (
          <Switch label="Done" checked={measure.currentValue === 1} onChange={(done) => void setMeasureDone(db, clock, measure.id, done)} />
        ) : (
          <span className={styles.target}>{measureValueText(measure, measure.checkIns)}</span>
        )
      }
    />
  );
}

function GoalCard({ data, weekStart }: { data: GoalWithMeasures; weekStart: string }) {
  const { db } = useServices();
  const { goal, measures } = data;
  const color = goalColor(goal, data.index);
  const progress = goalProgress(measures.map((m) => measureProgress(m, m.checkIns)));
  return (
    <article className={styles.card} style={{ '--goal-color': color } as CSSProperties} aria-label={goal.title} data-goal>
      <header className={styles.cardHead}>
        <button type="button" className={styles.cardTitle} onClick={() => navigate({ name: 'goal', id: goal.id })}>
          {goal.title}
        </button>
        <Menu
          label={`Status of ${goal.title}`}
          trigger={(props) => (
            <Chip tone={STATUS_TONE[goal.status]} {...props}>
              {STATUSES.find((s) => s.status === goal.status)?.label}
            </Chip>
          )}
          items={STATUSES.map(({ status, label }) => ({
            label,
            checked: status === goal.status,
            onSelect: () => void setGoalStatus(db, clock, goal.id, status),
          }))}
        />
      </header>
      {progress !== null && <ProgressBar value={progress} color={color} label={`Progress of ${goal.title}`} />}
      {measures.length > 0 && (
        <div>
          {measures.map((measure) => (
            <MeasureRow key={measure.id} measure={measure} color={color} />
          ))}
        </div>
      )}
      <NoteField targetType="goal" targetId={goal.id} weekStart={weekStart} label="Note for the week" />
    </article>
  );
}

/** Every active goal with its measures. A goal whose status changes stays listed until the step is left. */
export function GoalsStep({ weekStart }: { weekStart: string }) {
  const seen = useRef(new Set<string>());
  const goals = useLiveQuery(async (db) => {
    const active = await listActiveGoals(db);
    for (const g of active) seen.current.add(g.goal.id);
    const activeIds = new Set(active.map((g) => g.goal.id));
    const others = await Promise.all([...seen.current].filter((id) => !activeIds.has(id)).map((id) => getGoal(db, id)));
    return [...active, ...others.flatMap((g) => (g ? [g] : []))].sort((a, b) => a.index - b.index);
  });

  if (!goals) return null;
  if (goals.length === 0) return <EmptyState icon={Target} text="No active goals" />;
  return (
    <div className={styles.cards}>
      {goals.map((data) => (
        <GoalCard key={data.goal.id} data={data} weekStart={weekStart} />
      ))}
    </div>
  );
}
