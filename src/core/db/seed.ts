import { eq } from 'drizzle-orm';
import type { Db } from './drizzle.ts';
import { areas, settings } from './schema.ts';
import { createFields, type Clock } from './records.ts';

export const DEFAULT_AREAS = [
  { name: 'Job', color: '#1E88E5' },
  { name: 'Personal', color: '#8E24AA' },
  { name: 'Sport', color: '#43A047' },
  { name: 'Uni', color: '#FB8C00' },
] as const;

const SEEDED_KEY = 'default_areas_seeded';

/**
 * Inserts the default areas once per database. The areas and the "seeded"
 * flag are written in one batch, so a failed seed is retried on the next
 * start, and deleted default areas never come back.
 */
export async function seedDefaultAreas(db: Db, clock: Clock) {
  const seeded = await db.select().from(settings).where(eq(settings.key, SEEDED_KEY)).get();
  if (seeded) return;
  await db.batch([
    db.insert(areas).values(
      DEFAULT_AREAS.map((area, sortOrder) => ({ ...createFields(clock), ...area, sortOrder })),
    ),
    db.insert(settings).values({ key: SEEDED_KEY, value: '1' }),
  ]);
}
