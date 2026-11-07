import { useCallback, useState, type ReactNode } from 'react';
import { useServices } from '../../../app/services.ts';
import { ConfirmDialog } from '../../../core/ui/components/ConfirmDialog.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { usePromptNextStep } from '../../tasks/ui/useCompleteTask.ts';
import { completeTimer, discardTimer, pauseTimer, resumeTimer } from '../data/timer-repository.ts';
import { nextStepPromptAfterStop, type TimerView } from '../data/timer-view.ts';
import { workedMs } from '../domain/timer.ts';
import { CompleteDialog } from './CompleteDialog.tsx';

const clock = () => new Date();

export interface SessionActions {
  /** Logs the running stretch and pauses, without a dialog. */
  pause: () => void;
  resume: () => void;
  askComplete: () => void;
  /** Discards at once while paused; asks first while running (the running stretch is lost). */
  askDiscard: () => void;
  /** The dialogs; render them once next to the buttons. */
  dialogs: ReactNode;
}

/**
 * Pause and resume (no dialog), Complete (with "What did you get done?", then "Work logged" and, when it applies, the
 * next-step prompt) and Discard of the focus session. `onEnded` runs after Complete or Discard, for example to close focus mode.
 */
export function useSessionActions(view: TimerView, onEnded?: () => void): SessionActions {
  const { db } = useServices();
  const messages = useMessages();
  const promptNextStep = usePromptNextStep();
  const [dialog, setDialog] = useState<'complete' | 'discard' | null>(null);
  const paused = view.timer.pausedAt !== null;

  const complete = useCallback(
    async (note: string, markDone: boolean) => {
      await completeTimer(db, clock, note, { markHabitDone: markDone });
      // After completing, so a task that was the project's last next step is done by now.
      const prompt = await nextStepPromptAfterStop(db, view.timer);
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
    pause: () => void pauseTimer(db, clock),
    resume: () => void resumeTimer(db, clock),
    askComplete: () => setDialog('complete'),
    askDiscard: () => (paused ? void discard() : setDialog('discard')),
    dialogs: (
      <>
        {dialog === 'complete' && (
          <CompleteDialog
            title={view.title}
            workedMs={workedMs(view.timer, clock())}
            offerMarkDone={view.habit !== null && !view.habit.checkedToday}
            onComplete={(note, markDone) => void complete(note, markDone)}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog === 'discard' && (
          <ConfirmDialog
            title="Discard this stretch"
            text="The time since you last started or resumed is not logged. Earlier stretches stay."
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
