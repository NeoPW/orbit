import { ListTodo, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { EmptyState } from '../../../core/ui/components/EmptyState.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listOpenTasksOfProject } from '../../tasks/data/tasks-repository.ts';
import { effectiveImportance } from '../../tasks/domain/tasks.ts';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { TaskSheet } from '../../tasks/ui/TaskSheet.tsx';
import type { ProjectSectionProps } from './ProjectPage.tsx';

/** The project's open tasks once, next steps first (marked), with Add task. */
export function ProjectTasksSection({ view }: ProjectSectionProps) {
  const { project } = view;
  const tasks = useLiveQuery((db) => listOpenTasksOfProject(db, project.id), [project.id]);
  const [adding, setAdding] = useState(false);

  return (
    <Section
      title="Tasks"
      tile
      color={view.color}
      count={tasks?.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setAdding(true)}>
          Add task
        </Button>
      }
    >
      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          text="No open tasks"
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => setAdding(true)}>
              Add task
            </Button>
          }
        />
      )}
      {tasks && tasks.length > 0 && (
        <TaskList
          tasks={tasks}
          label="Open tasks"
          rowProps={(task) => ({
            projectColor: view.color,
            projectName: project.title,
            importance: effectiveImportance({
              importance: task.importance,
              projectImportance: project.importance,
            }),
          })}
        />
      )}
      {adding && <TaskSheet projectId={project.id} onClose={() => setAdding(false)} />}
    </Section>
  );
}
