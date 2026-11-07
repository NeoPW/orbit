import { and, eq, max } from 'drizzle-orm';
import type { Db } from '../../../core/db/drizzle.ts';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import { measureChanges, measures, type Measure, type MeasureType } from '../../../core/db/schema.ts';

export interface MeasureFields {
  title: string;
  description: string;
  measureType: MeasureType;
  startValue: number | null;
  /** The target; for a habit measure the target number of check-ins. */
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  step: number;
  habitId: string | null;
}

/** Fields that do not belong to the type are stored empty. */
function normalized(input: MeasureFields) {
  const base = {
    title: input.title.trim(),
    description: input.description.trim(),
    measureType: input.measureType,
  };
  if (input.measureType === 'numeric') {
    return {
      ...base,
      startValue: input.startValue,
      targetValue: input.targetValue,
      currentValue: input.currentValue,
      unit: input.unit?.trim() || null,
      step: input.step,
      habitId: null,
    };
  }
  if (input.measureType === 'boolean') {
    return {
      ...base,
      startValue: null,
      targetValue: null,
      currentValue: input.currentValue === 1 ? 1 : 0,
      unit: null,
      step: 1,
      habitId: null,
    };
  }
  return {
    ...base,
    startValue: null,
    targetValue: input.targetValue,
    currentValue: null,
    unit: null,
    step: 1,
    habitId: input.habitId,
  };
}

/** Adds a measure after the goal's other measures. */
export async function addMeasure(db: Db, clock: Clock, goalId: string, input: MeasureFields): Promise<string> {
  const [last] = await db
    .select({ value: max(measures.sortOrder) })
    .from(measures)
    .where(and(eq(measures.goalId, goalId), notDeleted(measures)));
  const fields = createFields(clock);
  await db.insert(measures).values({
    ...fields,
    ...normalized(input),
    goalId,
    sortOrder: (last?.value ?? -1) + 1,
  });
  return fields.id;
}

/** The query that records a value change of a measure (see measures, "Value history"). */
function recordChangeQuery(db: Db, clock: Clock, measureId: string, from: number | null, to: number) {
  return db.insert(measureChanges).values({ ...createFields(clock), measureId, fromValue: from, toValue: to });
}

export async function updateMeasure(db: Db, clock: Clock, id: string, input: MeasureFields): Promise<void> {
  const before = await getMeasure(db, id);
  const fields = normalized(input);
  const update = db
    .update(measures)
    .set({ ...updateFields(clock), ...fields })
    .where(and(eq(measures.id, id), notDeleted(measures)));
  // Only a value change within the same type is history; a new type starts a new series.
  const changed =
    before && before.measureType === fields.measureType && fields.currentValue !== null && before.currentValue !== fields.currentValue;
  if (changed) await db.batch([update, recordChangeQuery(db, clock, id, before.currentValue, fields.currentValue!)]);
  else await update;
}

export async function deleteMeasure(db: Db, clock: Clock, id: string): Promise<void> {
  await db.update(measures).set(deleteFields(clock)).where(eq(measures.id, id));
}

async function getMeasure(db: Db, id: string): Promise<Measure | undefined> {
  const [row] = await db
    .select()
    .from(measures)
    .where(and(eq(measures.id, id), notDeleted(measures)));
  return row;
}

/** Avoids 0.1 + 0.2 style results from the step buttons. */
const tidy = (n: number) => Math.round(n * 1e9) / 1e9;

/** Raises (`direction` 1) or lowers (-1) a numeric measure by its step; not limited to start or target. */
export async function stepMeasure(db: Db, clock: Clock, id: string, direction: 1 | -1): Promise<void> {
  const measure = await getMeasure(db, id);
  if (!measure || measure.measureType !== 'numeric') return;
  await setMeasureValue(db, clock, id, tidy((measure.currentValue ?? measure.startValue ?? 0) + direction * measure.step));
}

export async function setMeasureValue(db: Db, clock: Clock, id: string, value: number): Promise<void> {
  const before = await getMeasure(db, id);
  if (!before) return;
  const update = db
    .update(measures)
    .set({ ...updateFields(clock), currentValue: value })
    .where(and(eq(measures.id, id), notDeleted(measures)));
  if (before.currentValue === value) await update;
  else await db.batch([update, recordChangeQuery(db, clock, id, before.currentValue, value)]);
}

/** Marks a boolean measure achieved (current value 1) or not (0). */
export async function setMeasureDone(db: Db, clock: Clock, id: string, done: boolean): Promise<void> {
  await setMeasureValue(db, clock, id, done ? 1 : 0);
}
