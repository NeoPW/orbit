import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listProjectsByGoal } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { ProjectRow } from '../../projects/ui/ProjectRow.tsx';
import { ProjectSheet } from '../../projects/ui/ProjectSheet.tsx';
import type { GoalSectionProps } from './GoalPage.tsx';
import styles from './GoalPage.module.css';

/** Active projects first (Plan order), then backlog and paused ones; completed ones are counted. */
export function GoalProjectsSection({ data, color }: GoalSectionProps) {
  const goalId = data.goal.id;
  const views = useLiveQuery((db) => listProjectsByGoal(db, goalId), [goalId]);
  const [adding, setAdding] = useState(false);

  const active = sortViewsForPlan((views ?? []).filter((v) => v.project.status === 'active'));
  const others = sortViewsForPlan((views ?? []).filter((v) => v.project.status === 'backlog' || v.project.status === 'paused'));
  const completed = (views ?? []).filter((v) => v.project.status === 'completed').length;

  return (
    <Section
      title="Projects"
      tile
      color={color}
      count={active.length + others.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setAdding(true)}>
          Add project
        </Button>
      }
    >
      <div>
        {[...active, ...others].map((view) => (
          <ProjectRow key={view.project.id} view={view} showStatus />
        ))}
      </div>
      {completed > 0 && <p className={styles.completed}>{completed} completed</p>}
      {adding && <ProjectSheet goalId={goalId} onClose={() => setAdding(false)} />}
    </Section>
  );
}
