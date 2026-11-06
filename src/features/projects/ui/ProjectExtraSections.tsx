import { HabitsSection } from '../../habits/ui/HabitsSection.tsx';
import { NotesSection } from '../../notes/ui/NotesSection.tsx';
import { LogSection } from '../../work-log/ui/LogSection.tsx';
import type { ProjectSectionProps } from './ProjectPage.tsx';

export function ProjectHabitsSection({ view }: ProjectSectionProps) {
  return <HabitsSection projectId={view.project.id} tileColor={view.color} />;
}

export function ProjectLogSection({ view }: ProjectSectionProps) {
  return <LogSection target={{ projectId: view.project.id }} color={view.color} />;
}

export function ProjectNotesSection({ view }: ProjectSectionProps) {
  return <NotesSection targetType="project" targetId={view.project.id} color={view.color} />;
}
