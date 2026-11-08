import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useServices } from '../../../app/services.ts';
import { useToday } from '../../../core/dates/today.ts';
import { navigate, useRoute } from '../../../core/routing/useRoute.ts';
import { Button } from '../../../core/ui/components/Button.tsx';
import { SegmentedControl } from '../../../core/ui/components/SegmentedControl.tsx';
import { TextArea } from '../../../core/ui/components/TextField.tsx';
import { useMessages } from '../../../core/ui/messages/MessageProvider.tsx';
import { getReview, MAX_SCORE, MIN_SCORE, saveDraft, saveReview, type ReviewDraft } from '../data/reviews-repository.ts';
import { formatWeekFull, reviewWeekStart } from '../domain/review-week.ts';
import { GoalsStep } from './GoalsStep.tsx';
import { ProjectsStep } from './ProjectsStep.tsx';
import styles from './ReviewFlow.module.css';
import { useWeekSummary } from './useWeekSummary.ts';
import { WeekSummaryView } from './WeekSummaryView.tsx';

const clock = () => new Date();

export const STEP_NAMES = ['Look back', 'Projects', 'Goals', 'Score and reflection', 'Plan for next week', 'Save'] as const;
const LAST = STEP_NAMES.length;
const SCORE_STEP = 4;
const SCORES = Array.from({ length: MAX_SCORE - MIN_SCORE + 1 }, (_, i) => ({ value: MIN_SCORE + i, label: String(MIN_SCORE + i) }));

/** The step from the address: 1 to 6, step 1 for anything else. */
export function parseStep(step: string | undefined): number {
  const n = Number(step);
  return Number.isInteger(n) && n >= 1 && n <= LAST ? n : 1;
}

function LookBack({ weekStart }: { weekStart: string }) {
  const summary = useWeekSummary(weekStart, { live: true });
  return summary ? <WeekSummaryView summary={summary} /> : null;
}

interface BodyProps {
  weekStart: string;
  initial: ReviewDraft;
  step: number;
}

function FlowBody({ weekStart, initial, step }: BodyProps) {
  const { db } = useServices();
  const messages = useMessages();
  const [draft, setDraft] = useState(initial);
  const latest = useRef({ draft: initial, dirty: false });

  const change = (patch: Partial<ReviewDraft>) => {
    latest.current = { draft: { ...latest.current.draft, ...patch }, dirty: true };
    setDraft(latest.current.draft);
  };
  const flush = () => {
    if (!latest.current.dirty) return;
    latest.current.dirty = false;
    void saveDraft(db, clock, weekStart, latest.current.draft);
  };
  // The draft is stored when the step changes and when the review is left.
  useEffect(() => flush, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (next: number) => navigate({ name: 'review-flow', step: String(next) });
  const leave = () => navigate({ name: 'review' });

  async function save() {
    if (draft.score === null) {
      messages.show({ text: 'Choose a score from 1 to 10' });
      go(SCORE_STEP);
      return;
    }
    latest.current.dirty = false;
    const result = await saveReview(db, clock, weekStart, draft);
    if (!result.ok) {
      latest.current.dirty = true;
      messages.show({ text: result.error });
      go(SCORE_STEP);
      return;
    }
    messages.show({ text: 'Weekly review saved' });
    leave();
  }

  return (
    <div className={`${styles.flow} ${step === 1 ? styles.wide : ''}`}>
      <header className={styles.top}>
        <div className={styles.topRow}>
          <h1 className={styles.stepName}>{STEP_NAMES[step - 1]}</h1>
          <span className={styles.stepCount}>
            Step {step} of {LAST} · {formatWeekFull(weekStart)}
          </span>
          <Button variant="ghost" icon={<X />} onClick={leave}>
            Leave
          </Button>
        </div>
        <div className={styles.bar} role="progressbar" aria-label="Review progress" aria-valuemin={1} aria-valuemax={LAST} aria-valuenow={step} aria-valuetext={`Step ${step} of ${LAST}`}>
          <div className={styles.barFill} style={{ width: `${(step / LAST) * 100}%` }} />
        </div>
      </header>

      <div className={styles.step}>
        {step === 1 && <LookBack weekStart={weekStart} />}
        {step === 2 && <ProjectsStep weekStart={weekStart} />}
        {step === 3 && <GoalsStep weekStart={weekStart} />}
        {step === 4 && (
          <div className={styles.form}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Score for the week</span>
              <SegmentedControl label="Score" options={SCORES} value={draft.score} onChange={(score) => change({ score })} />
            </div>
            <TextArea label="Reflection" rows={8} value={draft.reflection} onChange={(event) => change({ reflection: event.target.value })} onBlur={flush} />
          </div>
        )}
        {step === 5 && (
          <div className={styles.form}>
            <TextArea label="Plan for next week" rows={10} value={draft.planNextWeek} onChange={(event) => change({ planNextWeek: event.target.value })} onBlur={flush} />
          </div>
        )}
        {step === 6 && (
          <div className={styles.form}>
            <dl className={styles.recap}>
              <dt>Score</dt>
              <dd>{draft.score ?? 'Not chosen yet'}</dd>
              {draft.reflection.trim() && (
                <>
                  <dt>Reflection</dt>
                  <dd className={styles.pre}>{draft.reflection.trim()}</dd>
                </>
              )}
              {draft.planNextWeek.trim() && (
                <>
                  <dt>Plan for next week</dt>
                  <dd className={styles.pre}>{draft.planNextWeek.trim()}</dd>
                </>
              )}
            </dl>
            <div>
              <Button variant="primary" icon={<Check />} onClick={() => void save()}>
                Save review
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <Button icon={<ArrowLeft />} disabled={step === 1} onClick={() => go(step - 1)}>
          Back
        </Button>
        {step < LAST && (
          <Button variant="primary" onClick={() => go(step + 1)}>
            Next
            <ArrowRight />
          </Button>
        )}
      </footer>
    </div>
  );
}

/** The guided weekly review at `/review/flow?step=N`. */
export function ReviewFlow() {
  const route = useRoute();
  const step = parseStep(route.name === 'review-flow' ? route.step : undefined);
  const { db } = useServices();
  const weekStart = reviewWeekStart(useToday());
  const [loaded, setLoaded] = useState<{ weekStart: string; draft: ReviewDraft } | null>(null);

  useEffect(() => {
    let active = true;
    void getReview(db, weekStart).then((review) => {
      if (active) setLoaded({ weekStart, draft: { score: review?.score ?? null, reflection: review?.reflection ?? '', planNextWeek: review?.planNextWeek ?? '' } });
    });
    return () => {
      active = false;
    };
  }, [db, weekStart]);

  if (!loaded || loaded.weekStart !== weekStart) return null;
  return <FlowBody key={weekStart} weekStart={weekStart} initial={loaded.draft} step={step} />;
}
