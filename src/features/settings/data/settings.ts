import { useCallback, useEffect, useState } from 'react';
import { useServices } from '../../../app/services.ts';
import type { Db } from '../../../core/db/drizzle.ts';
import { settings as settingsTable } from '../../../core/db/schema.ts';
import { DEFAULT_LEAD_DAYS } from '../../../core/dates/deadline.ts';
import { parseTime } from '../../../core/dates/parse.ts';
import { applyTheme, DEFAULT_THEME, isThemeId, type ThemeId } from '../../../core/ui/themes.ts';

/** The local settings (SPEC §4). `reviewDay` is the ISO weekday: 1 = Monday … 7 = Sunday. */
export interface Settings {
  remindersOn: boolean;
  /** `HH:mm`; for habits without own time and for deadline reminders. */
  reminderTime: string;
  /** Whole days, 1–30. */
  leadDays: number;
  reviewDay: number;
  /** `HH:mm`. */
  reviewTime: string;
  /** Colour theme of this device (not synced). */
  theme: ThemeId;
  /** Weekly hour target for the week summary, whole hours 1–168; null for none. */
  weeklyTargetHours: number | null;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = {
  remindersOn: true,
  reminderTime: '08:00',
  leadDays: DEFAULT_LEAD_DAYS,
  reviewDay: 7,
  reviewTime: '18:00',
  theme: DEFAULT_THEME,
  weeklyTargetHours: null,
};

/** Column `key` of the settings table for each setting. */
const STORAGE_KEYS: Record<SettingKey, string> = {
  remindersOn: 'reminders_on',
  reminderTime: 'reminder_time',
  leadDays: 'lead_days',
  reviewDay: 'review_day',
  reviewTime: 'review_time',
  theme: 'theme',
  weeklyTargetHours: 'weekly_target_hours',
};

function isWholeNumber(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** True when `value` may be stored for `key`. */
export function isValidSetting<K extends SettingKey>(key: K, value: Settings[K]): boolean {
  switch (key) {
    case 'remindersOn':
      return typeof value === 'boolean';
    case 'reminderTime':
    case 'reviewTime':
      return typeof value === 'string' && parseTime(value).ok;
    case 'leadDays':
      return typeof value === 'number' && isWholeNumber(value, 1, 30);
    case 'reviewDay':
      return typeof value === 'number' && isWholeNumber(value, 1, 7);
    case 'theme':
      return isThemeId(value);
    case 'weeklyTargetHours':
      return value === null || (typeof value === 'number' && isWholeNumber(value, 1, 168));
  }
}

function decode<K extends SettingKey>(key: K, stored: string | undefined): Settings[K] {
  const fallback = DEFAULT_SETTINGS[key];
  if (stored === undefined) return fallback;
  if (key === 'weeklyTargetHours') {
    const hours = stored === 'none' ? null : Number(stored);
    return (isValidSetting(key, hours as Settings[K]) ? hours : fallback) as Settings[K];
  }
  const value = typeof fallback === 'boolean' ? stored === '1' : typeof fallback === 'number' ? Number(stored) : stored;
  return isValidSetting(key, value as Settings[K]) ? (value as Settings[K]) : fallback;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Calls `listener` after any setting was saved (this table is not synced, so `onWrite` does not fire). */
export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reads all settings; missing or invalid stored values give the defaults. */
export async function readSettings(db: Db): Promise<Settings> {
  const rows = await db.select().from(settingsTable).all();
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const result = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(STORAGE_KEYS) as SettingKey[]) {
    (result[key] as Settings[SettingKey]) = decode(key, stored.get(STORAGE_KEYS[key]));
  }
  return result;
}

/** Saves one setting and notifies listeners. Returns false, saving nothing, when the value is not valid. */
export async function saveSetting<K extends SettingKey>(db: Db, key: K, value: Settings[K]): Promise<boolean> {
  if (!isValidSetting(key, value)) return false;
  const text = typeof value === 'boolean' ? (value ? '1' : '0') : value === null ? 'none' : String(value);
  await db
    .insert(settingsTable)
    .values({ key: STORAGE_KEYS[key], value: text })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: text } });
  if (key === 'theme') applyTheme(value as ThemeId);
  for (const listener of [...listeners]) listener();
  return true;
}

export interface UseSettings {
  /** The defaults until the stored values are read. */
  settings: Settings;
  loaded: boolean;
  save: <K extends SettingKey>(key: K, value: Settings[K]) => Promise<boolean>;
}

/** The settings, kept current when any of them is saved. */
export function useSettings(): UseSettings {
  const { db } = useServices();
  const [state, setState] = useState<{ settings: Settings; loaded: boolean }>({
    settings: DEFAULT_SETTINGS,
    loaded: false,
  });

  useEffect(() => {
    let active = true;
    const load = () => {
      void readSettings(db).then((settings) => {
        if (active) setState({ settings, loaded: true });
      });
    };
    load();
    const stop = subscribeSettings(load);
    return () => {
      active = false;
      stop();
    };
  }, [db]);

  const save = useCallback(<K extends SettingKey>(key: K, value: Settings[K]) => saveSetting(db, key, value), [db]);
  return { ...state, save };
}
