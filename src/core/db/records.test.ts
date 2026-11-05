import { describe, expect, it } from 'vitest';
import { createFields, deleteFields, naturalId, newId, TIMER_ID, updateFields } from './records.ts';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('record identity and timestamps', () => {
  it('create sets a new v4 id, equal UTC timestamps and no deleted_at', () => {
    const fields = createFields(() => new Date('2026-11-05T10:00:00.000Z'));
    expect(fields.id).toMatch(UUID_V4);
    expect(fields.createdAt).toBe('2026-11-05T10:00:00.000Z');
    expect(fields.updatedAt).toBe(fields.createdAt);
    expect(fields.deletedAt).toBeNull();
    expect(newId()).not.toBe(newId());
  });

  it('update bumps updated_at only', () => {
    const created = createFields(() => new Date('2026-11-05T10:00:00.000Z'));
    const update = updateFields(() => new Date('2026-11-05T11:00:00.000Z'));
    expect(update).toEqual({ updatedAt: '2026-11-05T11:00:00.000Z' });
    expect(update.updatedAt > created.updatedAt).toBe(true);
    expect('createdAt' in update).toBe(false);
  });

  it('delete sets deleted_at and updated_at', () => {
    const fields = deleteFields(() => new Date('2026-11-05T12:00:00.000Z'));
    expect(fields).toEqual({
      deletedAt: '2026-11-05T12:00:00.000Z',
      updatedAt: '2026-11-05T12:00:00.000Z',
    });
  });

  it('gives a habit check the same id for the same habit and date', () => {
    const a = naturalId('habit_check', 'habit-1', '2026-11-05');
    expect(a).toBe(naturalId('habit_check', 'habit-1', '2026-11-05'));
    expect(a).toMatch(UUID_V5);
    expect(a).not.toBe(naturalId('habit_check', 'habit-1', '2026-11-06'));
  });

  it('gives a note the same id per target and week, another for another week', () => {
    const a = naturalId('note', 'project', 'p-1', '2026-11-02');
    expect(a).toBe(naturalId('note', 'project', 'p-1', '2026-11-02'));
    expect(a).not.toBe(naturalId('note', 'project', 'p-1', '2026-11-09'));
  });

  it('uses one fixed id for the timer', () => {
    expect(TIMER_ID).toBe(naturalId('timer'));
    expect(TIMER_ID).toMatch(UUID_V5);
  });
});
