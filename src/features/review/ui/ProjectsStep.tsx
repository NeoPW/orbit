import { FolderKanban } from 'lucide-react';
import { useRef, useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useLiveQuery } from '../../../core/db/live.ts';
import type { ProjectStatus } from '../../../core/db/schema.ts';
import { navigate } from '../../../core/routing/useRoute.ts';
import { Chip } from '../../../core/ui/components/Chip.tsx';
import { DateField } from '../../../core/ui/components/DateField.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { Menu } from '../../../core/ui/components/Menu.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { TextField } from '../../../core/ui/components/TextField.tsx';
import { NoteField } from '../../notes/ui/NoteField.tsx';
import { listProjectsByStatus, setProjectStatus, updateProject, type ProjectView } from '../../projects/data/projects-repository.ts';
import { sortViewsForPlan } from '../../projects/domain/projects.ts';
import { PROJECT_STATUS_LABELS } from '../../projects/ui/ProjectRow.tsx';
import { listOpenTasksOfProject, setNextStep } from '../../tasks/data/tasks-repository.ts';
import { addNextStep } from '../data/next-step.ts';
import styles from './ReviewFlow.module.css';

const clock = () => new Date();
const STATUSES: ProjectStatus[] = ['active', 'paused', 'backlog', 'completed'];
const STATUS_TONE = { active: 'primary', backlog: 'neutral', paused: 'amber', completed: 'secondary' } as const;
const IMPORTANCE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

function NewNextStep({ projectId }: { projectId: string }) {
  const { db } = useServices();
  const [title, setTitle] = useState('');
  return (
    <TextField
      label="Add next step"
      value={title}
      placeholder="Title, then Enter"
      onChange={(event) => setTitle(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || title.trim() === '') return;
        event.preventDefault();
        void addNextStep(db, clock, projectId, title);
        setTitle('');
      }}
    />
  );
}

function ProjectCard({ view, weekStart }: { view: ProjectView; weekStart: string }) {
  const { db } = useServices();
  const { project } = view;
  const tasks = useLiveQuery((database) => listOpenTasksOfProject(database, project.id), [project.id]);
  const save = (patch: Partial<Pick<typeof project, 'importance' | 'deadline'>>) =>
    void updateProject(db, clock, project.id, {
      title: project.title,
      description: project.description,
      areaId: project.areaId,
      goalId: project.goalId,
      importance: project.importance,
      deadline: project.deadline,
      status: project.status,
      ...patch,
    });

  return (
    <article className={styles.card} aria-label={project.title}>
      <header className={styles.cardHead}>
        <button type="button" className={styles.cardTitle} onClick={() => navigate({ name: 'project', id: project.id })}>
          {project.title}
        </button>
        <Menu
          label={`Status of ${project.title}`}
          trigger={(props) => (
            <Chip tone={STATUS_TONE[project.status]} {...props}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Chip>
          )}
          items={STATUSES.map((status) => ({
            label: PROJECT_STATUS_LABELS[status],
            checked: status === project.status,
            onSelect: () => void setProjectStatus(db, clock, project.id, status),
          }))}
        />
      </header>
      <div className={styles.fields}>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Importance</span>
          <SegmentedControl label={`Importance of ${project.title}`} options={IMPORTANCE} value={project.importance} onChange={(value) => save({ importance: value })} />
        </div>
        <DateField label="Deadline" value={project.deadline} onChange={(value) => save({ deadline: value })} />
      </div>
      {tasks && tasks.length > 0 && (
        <div>
          {tasks.map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              onOpen={() => navigate({ name: 'task', id: task.id })}
              trailing={<Switch label="Next step" checked={task.isNextStep} onChange={(checked) => void setNextStep(db, clock, task.id, checked)} />}
            />
          ))}
        </div>
      )}
      <NewNextStep projectId={project.id} />
      <NoteField targetType="project" targetId={project.id} weekStart={weekStart} label="Note for the week" />
    </article>
  );
}

/** Every active project with its open tasks. A project whose status changes stays listed until the step is left. */
export function ProjectsStep({ weekStart }: { weekStart: string }) {
  const seen = useRef(new Set<string>());
  const views = useLiveQuery(async (db) => {
    const all = await listProjectsByStatus(db, ...STATUSES);
    for (const v of all) if (v.project.status === 'active') seen.current.add(v.project.id);
    return sortViewsForPlan(all.filter((v) => seen.current.has(v.project.id)));
  });

  if (!views) return null;
  if (views.length === 0) return <EmptyState icon={FolderKanban} text="No active projects" />;
  return (
    <div className={styles.cards}>
      {views.map((view) => (
        <ProjectCard key={view.project.id} view={view} weekStart={weekStart} />
      ))}
    </div>
  );
}

