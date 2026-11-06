/** The colour themes. The colour values live in theme.css; `ground` and `accent` only paint the swatches. */
export const THEMES = [
  { id: 'slate', name: 'Slate', ground: '#0f1218', accent: '#8b93ff' },
  { id: 'forest', name: 'Forest', ground: '#0e1512', accent: '#6fe0b0' },
  { id: 'ember', name: 'Ember', ground: '#15110e', accent: '#ff9f43' },
  { id: 'plum', name: 'Plum', ground: '#140f1a', accent: '#e58bd0' },
  { id: 'graphite', name: 'Graphite', ground: '#111112', accent: '#dcdfe6' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'slate';

/** localStorage key that mirrors the setting, read by the inline script in index.html before React starts. */
export const THEME_MIRROR_KEY = 'orbit-theme';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}

/** Sets `data-theme` on `<html>` and mirrors the id to localStorage. Safe without a DOM and when storage throws. */
export function applyTheme(id: ThemeId): void {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = id;
  try {
    globalThis.localStorage?.setItem(THEME_MIRROR_KEY, id);
  } catch {
    // Storage may be blocked or full; the setting in the database stays the source of truth.
  }
}

/** The mirrored theme id, or null when there is none or storage is unavailable. */
export function mirroredTheme(): ThemeId | null {
  try {
    const value = globalThis.localStorage?.getItem(THEME_MIRROR_KEY);
    return isThemeId(value) ? value : null;
  } catch {
    return null;
  }
}
