import { NotFound } from '../../../app/NotFound.tsx';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import styles from './TaskPage.module.css';
import { TaskDetails } from './TaskDetails.tsx';

/** The page of a task, at its own address. */
export function TaskPage() {
  const route = useRoute();
  const id = route.name === 'task' ? route.id : '';
  return (
    <div className={styles.page}>
      <TaskDetails
        id={id}
        missing={<NotFound text="Task not found" destination={{ name: 'plan' }} label="Go to Plan" />}
        onDeleted={({ projectId, goalId }) => {
          if (projectId) navigate({ name: 'project', id: projectId });
          else if (goalId) navigate({ name: 'goal', id: goalId });
          else navigate({ name: 'plan' });
        }}
      />
    </div>
  );
}
