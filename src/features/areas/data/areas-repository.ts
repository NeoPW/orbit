import { and, eq, max } from 'drizzle-orm';
import { createFields, deleteFields, notDeleted, updateFields, type Clock } from '../../../core/db/records.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { areas, projects, type Area } from '../../../core/db/schema.ts';

export interface AreaInput {
  name: string;
  color: string;
}

export type AreaResult = { ok: true } | { ok: false; error: 'empty' | 'duplicate' };

export const AREA_ERRORS = { empty: 'Enter a name', duplicate: 'This name is already used' } as const;

/** All areas in their sort order. */
export function listAreas(db: Db): Promise<Area[]> {
  return db.select().from(areas).where(notDeleted(areas)).orderBy(areas.sortOrder, areas.createdAt);
}

async function nameProblem(db: Db, name: string, ownId?: string): Promise<'empty' | 'duplicate' | null> {
  if (name === '') return 'empty';
  const taken = (await listAreas(db)).some((a) => a.id !== ownId && a.name.toLowerCase() === name.toLowerCase());
  return taken ? 'duplicate' : null;
}

/** Creates an area (trimmed name, unique case-insensitively) at the end of the list. */
export async function createArea(db: Db, clock: Clock, input: AreaInput): Promise<AreaResult> {
  const name = input.name.trim();
  const problem = await nameProblem(db, name);
  if (problem) return { ok: false, error: problem };
  const [last] = await db.select({ value: max(areas.sortOrder) }).from(areas).where(notDeleted(areas));
  await db.insert(areas).values({ ...createFields(clock), name, color: input.color, sortOrder: (last?.value ?? -1) + 1 });
  return { ok: true };
}

export async function updateArea(db: Db, clock: Clock, id: string, input: AreaInput): Promise<AreaResult> {
  const name = input.name.trim();
  const problem = await nameProblem(db, name, id);
  if (problem) return { ok: false, error: problem };
  await db.update(areas).set({ ...updateFields(clock), name, color: input.color }).where(and(eq(areas.id, id), notDeleted(areas)));
  return { ok: true };
}

/** Soft-deletes the area and clears `area_id` on its projects, in one batch. */
export async function deleteArea(db: Db, clock: Clock, id: string): Promise<void> {
  await db.batch([
    db.update(areas).set(deleteFields(clock)).where(eq(areas.id, id)),
    db.update(projects).set({ ...updateFields(clock), areaId: null }).where(and(eq(projects.areaId, id), notDeleted(projects))),
  ]);
}
