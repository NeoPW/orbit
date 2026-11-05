import { useCallback, useState, type ReactNode } from 'react';
import { useServices } from '../../../app/services.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { usePromptNextStep } from '../../tasks/ui/useCompleteTask.ts';
import { discardTimer, stopTimer } from '../data/timer-repository.ts';
import { nextStepPromptAfterStop, type TimerView } from '../data/timer-view.ts';
import { elapsedMs } from '../domain/timer.ts';
import { StopDialog } from './StopDialog.tsx';

const clock = () => new Date();

export interface StopTimer {
  askStop: () => void;
  askDiscard: () => void;
  /** The dialogs; render them once next to the buttons. */
  dialogs: ReactNode;
}

/**
 * Stop (with "What did you get done?", then "Work logged" and, when it applies,
 * the next-step prompt) and Discard (with a confirmation) of the running timer.
 * `onEnded` runs after either, for example to close focus mode.
 */
export function useStopTimer(view: TimerView, onEnded?: () => void): StopTimer {
  const { db } = useServices();
  const messages = useMessages();
  const promptNextStep = usePromptNextStep();
  const [dialog, setDialog] = useState<'stop' | 'discard' | null>(null);

  const stop = useCallback(
    async (note: string) => {
      const prompt = await nextStepPromptAfterStop(db, view.timer);
      await stopTimer(db, clock, note);
      setDialog(null);
      onEnded?.();
      messages.show({ text: 'Work logged' });
      if (prompt) await promptNextStep(prompt);
    },
    [db, messages, onEnded, promptNextStep, view.timer],
  );

  const discard = useCallback(async () => {
    await discardTimer(db, clock);
    setDialog(null);
    onEnded?.();
  }, [db, onEnded]);

  return {
    askStop: () => setDialog('stop'),
    askDiscard: () => setDialog('discard'),
    dialogs: (
      <>
        {dialog === 'stop' && (
          <StopDialog title={view.title} elapsedMs={elapsedMs(view.timer.startedAt, clock())} onStop={(note) => void stop(note)} onCancel={() => setDialog(null)} />
        )}
        {dialog === 'discard' && (
          <ConfirmDialog
            title="Discard this session"
            text="The time is not logged."
            confirmLabel="Discard"
            danger
            onCancel={() => setDialog(null)}
            onConfirm={() => void discard()}
          />
        )}
      </>
    ),
  };
}
