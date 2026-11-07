import { describe, expect, it, vi } from 'vitest';
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
      theme: 'slate',
    });
  });

  it('keeps saved values when read again from the same database', async () => {
    const { db } = await openTestDatabase();
    expect(await saveSetting(db, 'leadDays', 3)).toBe(true);
    expect(await saveSetting(db, 'remindersOn', false)).toBe(true);
    expect(await saveSetting(db, 'reviewTime', '10:00')).toBe(true);
    const read = await readSettings(db);
    expect(read).toEqual({
      ...DEFAULT_SETTINGS,
      leadDays: 3,
      remindersOn: false,
      reviewTime: '10:00',
    });
  });

  it('notifies its own listeners after a save', async () => {
    const { db } = await openTestDatabase();
    let settingsCalls = 0;
    const stop = subscribeSettings(() => settingsCalls++);
    await saveSetting(db, 'leadDays', 5);
    stop();
    await saveSetting(db, 'leadDays', 6);
    expect(settingsCalls).toBe(1);
  });

  it('does not save a lead time of 0 or 31', async () => {
    const { db } = await openTestDatabase();
    expect(await saveSetting(db, 'leadDays', 0)).toBe(false);
    expect(await saveSetting(db, 'leadDays', 31)).toBe(false);
    expect(await saveSetting(db, 'leadDays', 2.5)).toBe(false);
    expect((await readSettings(db)).leadDays).toBe(7);
  });

  it('keeps the chosen theme and rejects an unknown one', async () => {
    const { db } = await openTestDatabase();
    expect(await saveSetting(db, 'theme', 'ember')).toBe(true);
    expect((await readSettings(db)).theme).toBe('ember');
    expect(await saveSetting(db, 'theme', 'neon' as never)).toBe(false);
    expect((await readSettings(db)).theme).toBe('ember');
  });

  it('applies and mirrors a saved theme, and survives failing storage', async () => {
    const { db } = await openTestDatabase();
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      setItem: (k: string, v: string) => store.set(k, v),
      getItem: (k: string) => store.get(k) ?? null,
    });
    try {
      await saveSetting(db, 'theme', 'plum');
      expect(store.get('orbit-theme')).toBe('plum');
      vi.stubGlobal('localStorage', {
        setItem: () => {
          throw new Error('blocked');
        },
      });
      expect(await saveSetting(db, 'theme', 'forest')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
