import type { CSSProperties } from 'react';
import { THEMES, type ThemeId } from '../themes.ts';
import styles from './ThemeSwitcher.module.css';

export interface ThemeSwitcherProps {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  /** Shows the theme names next to the swatches (Settings). */
  showNames?: boolean;
  /** Accessible name of the group. */
  label?: string;
}

/** One swatch button per colour theme: the theme's ground with a dot in its accent. */
export function ThemeSwitcher({ value, onChange, showNames = false, label = 'Colour theme' }: ThemeSwitcherProps) {
  return (
    <div className={`${styles.switcher} ${showNames ? styles.named : ''}`} role="group" aria-label={label}>
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={styles.option}
          aria-pressed={theme.id === value}
          aria-label={showNames ? undefined : theme.name}
          title={theme.name}
          onClick={() => onChange(theme.id)}
        >
          <span className={styles.swatch} style={{ '--ground': theme.ground, '--accent': theme.accent } as CSSProperties}>
            <span className={styles.dot} />
          </span>
          {showNames && <span className={styles.name}>{theme.name}</span>}
        </button>
      ))}
    </div>
  );
}
