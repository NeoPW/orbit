import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useServices } from '../../../app/services.ts';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import {
  applyNextStepChoice,
  completeTask,
  listOpenNextSteps,
  listOpenTasksOfProject,
  undoCompleteTask,
  type NextStepChoice,
  type Task,
} from '../data/tasks-repository.ts';
import { nextStepOutcome } from '../domain/tasks.ts';
import { NextStepPrompt } from './NextStepPrompt.tsx';
import {
  CompleteTaskContext,
  PromptNextStepContext,
  type CompletableTask,
  type CompleteTask,
  type PromptNextStep,
} from './useCompleteTask.ts';

const clock = () => new Date();

interface Asking {
  task: CompletableTask;
  /** The other open tasks of the project, to pick from. */
  candidates: Task[];
  title: string;
  resolve: (completed: boolean) => void;
}

/** Runs the complete-task flow for `useCompleteTask()` and renders the next-step prompt. */
export function CompleteTaskProvider({ children }: { children: ReactNode }) {
  const { db } = useServices();
  const messages = useMessages();
  const [asking, setAsking] = useState<Asking | null>(null);

  const finish = useCallback(
    async (task: CompletableTask, choice: NextStepChoice): Promise<boolean> => {
      const done = await completeTask(db, clock, task.id, choice);
      if (!done) return false;
      messages.show({ text: 'Task completed', action: { label: 'Undo', run: () => void undoCompleteTask(db, clock, done) } });
      return true;
    },
    [db, messages],
  );

  const complete = useCallback<CompleteTask>(
    async (task) => {
      const steps = task.projectId ? await listOpenNextSteps(db, task.projectId) : [];
      if (nextStepOutcome(task, steps) === 'direct') return finish(task, { kind: 'direct' });
      const open = await listOpenTasksOfProject(db, task.projectId!);
      const title = open.find((t) => t.id === task.id)?.title ?? '';
      return new Promise<boolean>((resolve) =>
        setAsking({ task, title, candidates: open.filter((t) => t.id !== task.id), resolve }),
      );
    },
    [db, finish],
  );

  const [after, setAfter] = useState<{ projectId: string; title: string; candidates: Task[]; resolve: () => void } | null>(null);

  const promptNextStep = useCallback<PromptNextStep>(
    async (task) => {
      const candidates = (await listOpenTasksOfProject(db, task.projectId)).filter((t) => t.id !== task.id);
      return new Promise<void>((resolve) => setAfter({ projectId: task.projectId, title: task.title, candidates, resolve }));
    },
    [db],
  );

  const value = useMemo(() => complete, [complete]);

  function close(completed: boolean) {
    asking?.resolve(completed);
    setAsking(null);
  }

  return (
    <CompleteTaskContext.Provider value={value}>
      <PromptNextStepContext.Provider value={promptNextStep}>{children}</PromptNextStepContext.Provider>
      {after && (
        <NextStepPrompt
          taskTitle={after.title}
          candidates={after.candidates}
          onCancel={() => {
            after.resolve();
            setAfter(null);
          }}
          onChoose={(choice) => {
            void applyNextStepChoice(db, clock, after.projectId, choice).then(() => {
              after.resolve();
              setAfter(null);
            });
          }}
        />
      )}
      {asking && (
        <NextStepPrompt
          taskTitle={asking.title}
          candidates={asking.candidates}
          onCancel={() => close(false)}
          onChoose={(choice) => {
            const { task } = asking;
            void finish(task, choice).then((completed) => close(completed));
          }}
        />
      )}
    </CompleteTaskContext.Provider>
  );
}
