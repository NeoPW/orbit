import { HabitsSection } from '../../habits/ui/HabitsSection.tsx';
import { NotesSection } from '../../notes/ui/NotesSection.tsx';
import { GoalWorkSection } from '../../work-log/ui/GoalWorkSection.tsx';
import type { GoalSectionProps } from './GoalPage.tsx';

export function GoalHabitsSection({ data }: GoalSectionProps) {
  return <HabitsSection goalId={data.goal.id} />;
}

export function GoalWorkSectionOf({ data }: GoalSectionProps) {
  return <GoalWorkSection goalId={data.goal.id} />;
}

export function GoalNotesSection({ data }: GoalSectionProps) {
  return <NotesSection targetType="goal" targetId={data.goal.id} />;
}
