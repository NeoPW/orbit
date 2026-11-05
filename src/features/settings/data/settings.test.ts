import { describe, expect, it } from 'vitest';
import { openTestDatabase } from '../../../core/db/testing.ts';
import { DEFAULT_SETTINGS, readSettings, saveSetting, subscribeSettings } from './settings.ts';

describe('settings', () => {
  it('has the defaults on a new installation', async () => {
    const { db } = await openTestDatabase();
    expect(await readSettings(db)).toEqual({
      remindersOn: true,
      reminderTime: '08:00',
      leadDays: 7,
      reviewDay: 7,
      reviewTime: '18:00',
      focusMinutes: 25,
    });
  });

  it('keeps saved values when read again from the same database', async () => {
    const { db } = await openTestDatabase();
    expect(await saveSetting(db, 'leadDays', 3)).toBe(true);
    expect(await saveSetting(db, 'remindersOn', false)).toBe(true);
    expect(await saveSetting(db, 'reviewTime', '10:00')).toBe(true);
    const read = await readSettings(db);
    expect(read).toEqual({ ...DEFAULT_SETTINGS, leadDays: 3, remindersOn: false, reviewTime: '10:00' });
  });

  it('notifies its own listeners after a save', async () => {
    const { db } = await openTestDatabase();
    let settingsCalls = 0;
    const stop = subscribeSettings(() => settingsCalls++);
    await saveSetting(db, 'focusMinutes', 50);
    stop();
    await saveSetting(db, 'focusMinutes', 90);
    expect(settingsCalls).toBe(1);
  });

  it('does not save a lead time of 0 or 31', async () => {
    const { db } = await openTestDatabase();
    expect(await saveSetting(db, 'leadDays', 0)).toBe(false);
    expect(await saveSetting(db, 'leadDays', 31)).toBe(false);
    expect(await saveSetting(db, 'leadDays', 2.5)).toBe(false);
    expect((await readSettings(db)).leadDays).toBe(7);
  });
});
