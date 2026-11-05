import { createContext, useContext } from 'react';
import type { Task } from '../data/tasks-repository.ts';

/** What completing needs to know about a task. */
export type CompletableTask = Pick<Task, 'id' | 'projectId' | 'isNextStep'>;

/**
 * Completes a task the way every screen should: asks "What's the next step?"
 * first when it is the last open next step of its project, then completes it
 * and shows "Task completed" with Undo. Resolves to true when the task was
 * completed and to false when the user cancelled the prompt (nothing changed).
 */
export type CompleteTask = (task: CompletableTask) => Promise<boolean>;

export const CompleteTaskContext = createContext<CompleteTask | null>(null);

/** The single entry point for completing tasks; needs the `CompleteTaskProvider` (mounted in the Shell). */
export function useCompleteTask(): CompleteTask {
  const complete = useContext(CompleteTaskContext);
  if (!complete) throw new Error('useCompleteTask() needs a CompleteTaskProvider');
  return complete;
}

/**
 * Shows "What's the next step?" for a task that is already completed (after a
 * focus session) and applies the choice. Resolves when the prompt is closed.
 */
export type PromptNextStep = (task: { id: string; title: string; projectId: string }) => Promise<void>;

export const PromptNextStepContext = createContext<PromptNextStep | null>(null);

export function usePromptNextStep(): PromptNextStep {
  const prompt = useContext(PromptNextStepContext);
  if (!prompt) throw new Error('usePromptNextStep() needs a CompleteTaskProvider');
  return prompt;
}
