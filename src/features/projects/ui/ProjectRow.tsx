import type { ReactNode } from 'react';
import { navigate } from '../../../core/routing/useRoute.ts';
import type { Area, ProjectStatus } from '../../../core/db/schema.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import type { ProjectView } from '../data/projects-repository.ts';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  backlog: 'Backlog',
  paused: 'Paused',
  completed: 'Completed',
};

export interface ProjectRowProps {
  view: ProjectView;
  /** The project's area, shown as a chip. */
  area?: Area;
  /** Shows a chip with the status (the Backlog, a goal page). */
  showStatus?: boolean;
  /** Shows the title of the goal it serves (Projects without a goal). */
  showGoal?: boolean;
  /** Controls at the end of the row, for example "Activate". */
  trailing?: ReactNode;
}

/** A project as a row: title, area, importance, effective deadline. Clicking opens its page. */
export function ProjectRow({ view, area, showStatus = false, showGoal = false, trailing }: ProjectRowProps) {
  const { project, deadline } = view;
  return (
    <ListRow
      title={project.title}
      onOpen={() => navigate({ name: 'project', id: project.id })}
      meta={
        <>
          {showStatus && project.status !== 'active' && <Chip tone="amber">{PROJECT_STATUS_LABELS[project.status]}</Chip>}
          {area && <Chip color={area.color}>{area.name}</Chip>}
          <ImportanceDots value={project.importance} />
          {showGoal && view.goalTitle && <span>{view.goalTitle}</span>}
          {deadline && <DeadlineBadge deadline={deadline.date} inherited={deadline.inherited} />}
        </>
      }
      trailing={trailing}
    />
  );
}
