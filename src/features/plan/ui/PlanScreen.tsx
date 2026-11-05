import { ChevronDown, FolderKanban, ListTodo, Plus, Repeat, Target } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { HabitSheet } from '../../habits/ui/HabitSheet.tsx';
import { GoalSheet } from '../../goals/ui/GoalSheet.tsx';
import { ProjectSheet } from '../../projects/ui/ProjectSheet.tsx';
import { TaskSheet } from '../../tasks/ui/TaskSheet.tsx';
import { AreasSection } from './AreasSection.tsx';
import { ArchiveSection } from './ArchiveSection.tsx';
import { BacklogSection } from './BacklogSection.tsx';
import { ProjectsWithoutGoalSection } from './ProjectsWithoutGoalSection.tsx';
import { GoalsSection } from './GoalsSection.tsx';
import { HabitsPlanSection } from './HabitsPlanSection.tsx';
import styles from './PlanScreen.module.css';
import type { PlanCreate, PlanSectionProps } from './sections.ts';

// The sections of Plan in order.
const SECTIONS: ComponentType<PlanSectionProps>[] = [GoalsSection, ProjectsWithoutGoalSection, BacklogSection, HabitsPlanSection, AreasSection, ArchiveSection];

// The "New" menu.
const NEW_ITEMS: { kind: PlanCreate; label: string; icon: ReactNode }[] = [
  { kind: 'goal', label: 'Goal', icon: <Target /> },
  { kind: 'project', label: 'Project', icon: <FolderKanban /> },
  { kind: 'task', label: 'Task', icon: <ListTodo /> },
  { kind: 'habit', label: 'Habit', icon: <Repeat /> },
];

export function PlanScreen() {
  const [creating, setCreating] = useState<PlanCreate | null>(null);

  return (
    <div className={styles.plan}>
      <PageHeader
        title="Plan"
        actions={
          <Menu
            label="New"
            trigger={(props) => (
              <Button variant="primary" icon={<Plus />} {...props}>
                New
                <ChevronDown />
              </Button>
            )}
            items={NEW_ITEMS.map(({ kind, label, icon }) => ({ label, icon, onSelect: () => setCreating(kind) }))}
          />
        }
      />
      <div className={styles.sections}>
        {SECTIONS.map((SectionComponent, i) => (
          <SectionComponent key={i} onCreate={setCreating} />
        ))}
      </div>
      {creating === 'goal' && <GoalSheet onClose={() => setCreating(null)} />}
      {creating === 'project' && <ProjectSheet onClose={() => setCreating(null)} />}
      {creating === 'task' && <TaskSheet onClose={() => setCreating(null)} />}
      {creating === 'habit' && <HabitSheet onClose={() => setCreating(null)} />}
    </div>
  );
}
