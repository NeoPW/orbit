import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { Measure } from '../../../core/db/schema.ts';
import { Button, IconButton } from '../../../core/ui/components/Button.tsx';
import { ListRow } from '../../../core/ui/components/ListRow.tsx';
import { ProgressBar } from '../../../core/ui/components/ProgressBar.tsx';
import { Section } from '../../../core/ui/components/Section.tsx';
import { Switch } from '../../../core/ui/components/Switch.tsx';
import { setMeasureDone, setMeasureValue, stepMeasure } from '../data/measures-repository.ts';
import { measureProgress, measureValueText } from '../domain/goals.ts';
import type { GoalSectionProps } from './GoalPage.tsx';
import styles from './GoalPage.module.css';
import { MeasureSheet } from './MeasureSheet.tsx';

const clock = () => new Date();

/** The current value of a numeric measure; a click turns it into a field (Enter saves, Escape cancels). */
function ValueEditor({ measure }: { measure: Measure }) {
  const { db } = useServices();
  const [text, setText] = useState<string | null>(null);

  if (text === null) {
    return (
      <button type="button" className={styles.value} aria-label={`Value of ${measure.title}`} onClick={() => setText(String(measure.currentValue ?? 0))}>
        {measure.currentValue ?? 0}
      </button>
    );
  }
  return (
    <input
      className={styles.valueInput}
      aria-label={`Value of ${measure.title}`}
      inputMode="decimal"
      value={text}
      autoFocus
      onFocus={(event) => event.target.select()}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => setText(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setText(null);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          const value = Number(text.trim().replace(',', '.'));
          if (text.trim() !== '' && Number.isFinite(value)) void setMeasureValue(db, clock, measure.id, value);
          setText(null);
        }
      }}
    />
  );
}

export function MeasuresSection({ data, color }: GoalSectionProps) {
  const { db } = useServices();
  const [sheet, setSheet] = useState<{ measure?: Measure } | null>(null);

  return (
    <Section
      title="Measures"
      tile
      color={color}
      count={data.measures.length}
      actions={
        <Button variant="ghost" icon={<Plus />} onClick={() => setSheet({})}>
          New measure
        </Button>
      }
    >
      {data.measures.length > 0 && (
        <div>
          {data.measures.map((measure) => {
            const progress = measureProgress(measure, measure.checkIns);
            const unit = measure.unit ? ` ${measure.unit}` : '';
            return (
              <ListRow
                key={measure.id}
                title={measure.title}
                onOpen={() => setSheet({ measure })}
                meta={<ProgressBar value={progress} color={color} label={measure.title} />}
                trailing={
                  measure.measureType === 'numeric' ? (
                    <>
                      <IconButton label={`Lower ${measure.title}`} icon={<Minus />} onClick={() => void stepMeasure(db, clock, measure.id, -1)} />
                      <ValueEditor measure={measure} />
                      <span className={styles.target}>
                        / {measure.targetValue ?? 0}
                        {unit}
                      </span>
                      <IconButton label={`Raise ${measure.title}`} icon={<Plus />} onClick={() => void stepMeasure(db, clock, measure.id, 1)} />
                    </>
                  ) : measure.measureType === 'boolean' ? (
                    <Switch label="Done" checked={measure.currentValue === 1} onChange={(done) => void setMeasureDone(db, clock, measure.id, done)} />
                  ) : (
                    <span className={styles.target}>{measureValueText(measure, measure.checkIns)}</span>
                  )
                }
              />
            );
          })}
        </div>
      )}
      {sheet && <MeasureSheet goalId={data.goal.id} measure={sheet.measure} onClose={() => setSheet(null)} />}
    </Section>
  );
}
