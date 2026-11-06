import { Pencil, Trash2 } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties } from 'react';
import { NotFound } from '../../../app/NotFound.tsx';
import { useServices } from '../../../app/services.ts';
import { formatDateRange } from '../../../core/dates/format.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { GoalStatus } from '../../../core/db/schema.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { Tile } from '../../../core/ui/components/Tile.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { goalColor } from '../../../core/ui/colors.ts';
import { deleteGoal, getGoal, setGoalStatus, type GoalWithMeasures } from '../data/goals-repository.ts';
import { goalProgress, measureProgress } from '../domain/goals.ts';
import { GoalHabitsSection, GoalNotesSection, GoalWorkSectionOf } from './GoalExtraSections.tsx';
import { GoalProjectsSection } from './GoalProjectsSection.tsx';
import { GoalSheet } from './GoalSheet.tsx';
import styles from './GoalPage.module.css';
import { GoalTasksSection } from './GoalTasksSection.tsx';
import { MeasuresSection } from './MeasuresSection.tsx';

export interface GoalSectionProps {
  data: GoalWithMeasures;
  color: string;
}

// The sections below the description, in order.
const SECTIONS: ComponentType<GoalSectionProps>[] = [
  MeasuresSection,
  GoalProjectsSection,
  GoalTasksSection,
  GoalHabitsSection,
  GoalWorkSectionOf,
  GoalNotesSection,
];

const STATUSES: { status: GoalStatus; label: string }[] = [
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
  { status: 'archived', label: 'Archived' },
];

const STATUS_TONE = {
  active: 'primary',
  completed: 'secondary',
  archived: 'neutral',
} as const;

const clock = () => new Date();

export function GoalPage() {
  const route = useRoute();
  const id = route.name === 'goal' ? route.id : '';
  const { db } = useServices();
  const messages = useMessages();
  const loaded = useLiveQuery(async (database) => (await getGoal(database, id)) ?? null, [id]);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (loaded === undefined) return null;
  if (loaded === null) return <NotFound text="Goal not found" destination={{ name: 'plan' }} label="Go to Plan" />;

  const { goal, index, measures } = loaded;
  const color = goalColor(goal, index);
  const progress = goalProgress(measures.map((m) => measureProgress(m, m.checkIns)));
  const count = measures.length;

  return (
    <div className={styles.page} style={{ '--goal-color': color } as CSSProperties}>
      <Tile
        as="article"
        color={color}
        tinted
        title={
          <div className={styles.titles}>
            <h1 className={styles.heading}>{goal.title}</h1>
            <div className={styles.meta}>
              <Menu
                label="Status"
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
              {goal.startDate && goal.endDate && <Chip>{formatDateRange(goal.startDate, goal.endDate)}</Chip>}
              {goal.status === 'active' && goal.endDate && <DeadlineBadge deadline={goal.endDate} />}
            </div>
          </div>
        }
        actions={
          <>
            <Button icon={<Pencil />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" icon={<Trash2 />} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          </>
        }
      >
        {goal.description && <p className={styles.description}>{goal.description}</p>}
        {progress !== null && <ProgressBar value={progress} color={color} label={`Progress of ${goal.title}`} />}
      </Tile>
      <div className={styles.sections}>
        {SECTIONS.map((SectionComponent, i) => (
          <SectionComponent key={i} data={loaded} color={color} />
        ))}
      </div>
      {editing && <GoalSheet goal={goal} onClose={() => setEditing(false)} />}
      {confirming && (
        <ConfirmDialog
          title="Delete goal"
          text={
            count === 0
              ? `Delete "${goal.title}"? Its projects, tasks and habits stay, without the goal.`
              : `Delete "${goal.title}" and its ${count === 1 ? '1 measure' : `${count} measures`}? Its projects, tasks and habits stay, without the goal.`
          }
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            void deleteGoal(db, clock, goal.id).then(() => {
              navigate({ name: 'plan' });
              messages.show({ text: 'Goal deleted' });
            });
          }}
        />
      )}
    </div>
  );
}
