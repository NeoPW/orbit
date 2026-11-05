import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from '../../../core/db/live.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { listOpenTasksOfGoal } from '../../tasks/data/tasks-repository.ts';
import { TaskList } from '../../tasks/ui/TaskRow.tsx';
import { TaskSheet } from '../../tasks/ui/TaskSheet.tsx';
import type { GoalSectionProps } from './GoalPage.tsx';

/** Open tasks assigned to the goal itself. */
export function GoalTasksSection({ data }: GoalSectionProps) {
  const goalId = data.goal.id;
  const tasks = useLiveQuery((db) => listOpenTasksOfGoal(db, goalId), [goalId]);
  const [adding, setAdding] = useState(false);

  return (
    <Section
      title="Tasks"
      count={tasks?.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setAdding(true)}>
          Add task
        </Button>
      }
    >
      {tasks && tasks.length > 0 && <TaskList tasks={tasks} label="Open tasks" />}
      {adding && <TaskSheet goalId={goalId} onClose={() => setAdding(false)} />}
    </Section>
  );
}
