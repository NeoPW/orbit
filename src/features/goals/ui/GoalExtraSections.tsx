import { HabitsSection } from '../../habits/ui/HabitsSection.tsx';
import { NotesSection } from '../../notes/ui/NotesSection.tsx';
import { GoalWorkSection } from '../../work-log/ui/GoalWorkSection.tsx';
import type { GoalSectionProps } from './GoalPage.tsx';

export function GoalHabitsSection({ data, color }: GoalSectionProps) {
  return <HabitsSection goalId={data.goal.id} tileColor={color} />;
}

export function GoalWorkSectionOf({ data, color }: GoalSectionProps) {
  return <GoalWorkSection goalId={data.goal.id} color={color} />;
}

export function GoalNotesSection({ data, color }: GoalSectionProps) {
  return <NotesSection targetType="goal" targetId={data.goal.id} color={color} />;
}
