import { Pencil } from 'lucide-react';
import { useState, type ComponentType, type CSSProperties } from 'react';
import { NotFound } from '../../../app/NotFound.tsx';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { ProjectStatus } from '../../../core/db/schema.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DeadlineBadge } from '../../../core/ui/components/DeadlineBadge.tsx';
import { ImportanceDots } from '../../../core/ui/components/ImportanceDots.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { PageHeader } from '../../../core/ui/components/PageHeader.tsx';
import { goalColor } from '../../../core/ui/palette.ts';
import { listAreas } from '../../areas/data/areas-repository.ts';
import { getGoal } from '../../goals/data/goals-repository.ts';
import { getProject, setProjectStatus, type ProjectView } from '../data/projects-repository.ts';
import styles from './ProjectPage.module.css';
import { PROJECT_STATUS_LABELS } from './ProjectRow.tsx';
import { ProjectSheet } from './ProjectSheet.tsx';
import { ProjectHabitsSection, ProjectLogSection, ProjectNotesSection } from './ProjectExtraSections.tsx';
import { ProjectTasksSection } from './ProjectTasksSection.tsx';

export interface ProjectSectionProps {
  view: ProjectView;
}

// The sections below the description, in order.
const SECTIONS: ComponentType<ProjectSectionProps>[] = [ProjectTasksSection, ProjectHabitsSection, ProjectLogSection, ProjectNotesSection];

const STATUSES: ProjectStatus[] = ['active', 'paused', 'backlog', 'completed'];
const STATUS_TONE = { active: 'primary', backlog: 'neutral', paused: 'amber', completed: 'secondary' } as const;

const clock = () => new Date();

export function ProjectPage() {
  const route = useRoute();
  const id = route.name === 'project' ? route.id : '';
  const { db } = useServices();
  const loaded = useLiveQuery(
    async (database) => {
      const view = await getProject(database, id);
      if (!view) return null;
      const [areas, goal] = await Promise.all([listAreas(database), view.project.goalId ? getGoal(database, view.project.goalId) : undefined]);
      return { view, area: areas.find((a) => a.id === view.project.areaId), goal };
    },
    [id],
  );
  const [editing, setEditing] = useState(false);

  if (loaded === undefined) return null;
  if (loaded === null) return <NotFound text="Project not found" destination={{ name: 'plan' }} label="Go to Plan" />;

  const { view, area, goal } = loaded;
  const { project, deadline } = view;

  return (
    <div className={styles.page}>
      <PageHeader
        title={project.title}
        meta={
          <>
            <Menu
              label="Status"
              trigger={(props) => (
                <Chip tone={STATUS_TONE[project.status]} {...props}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Chip>
              )}
              items={STATUSES.filter((status) => status !== project.status).map((status) => ({
                label: PROJECT_STATUS_LABELS[status],
                onSelect: () => void setProjectStatus(db, clock, project.id, status),
              }))}
            />
            {area && <Chip color={area.color}>{area.name}</Chip>}
            <ImportanceDots value={project.importance} />
            {deadline && <DeadlineBadge deadline={deadline.date} inherited={deadline.inherited} />}
          </>
        }
        actions={
          <Button icon={<Pencil />} onClick={() => setEditing(true)}>
            Edit
          </Button>
        }
      />
      {project.description && <p className={styles.description}>{project.description}</p>}
      {goal && (
        <button
          type="button"
          className={styles.goalLink}
          style={{ '--goal-color': goalColor(goal.goal, goal.index) } as CSSProperties}
          onClick={() => navigate({ name: 'goal', id: goal.goal.id })}
        >
          {goal.goal.title}
        </button>
      )}
      <div className={styles.sections}>
        {SECTIONS.map((SectionComponent, i) => (
          <SectionComponent key={i} view={view} />
        ))}
      </div>
      {editing && <ProjectSheet project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}
