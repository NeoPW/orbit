import { CalendarRange, House, NotebookPen, Settings, type LucideIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import orbitIcon from '../../assets/icon/orbit.png';
import { navigate } from '../core/routing/useRoute.ts';
import { pathOf, type Route, type Section } from '../core/routing/routes.ts';
import styles from './Sidebar.module.css';
import { SHORTCUTS, withShortcut, type GlobalAction } from './shortcuts/keys.ts';

interface Entry {
  route: Route;
  section: Section;
  label: string;
  icon: LucideIcon;
  shortcut: GlobalAction;
}

const MAIN: Entry[] = [
  { route: { name: 'home' }, section: 'home', label: 'Home', icon: House, shortcut: 'go-home' },
  { route: { name: 'plan' }, section: 'plan', label: 'Plan', icon: CalendarRange, shortcut: 'go-plan' },
  { route: { name: 'review' }, section: 'review', label: 'Review', icon: NotebookPen, shortcut: 'go-review' },
];

const SETTINGS: Entry = { route: { name: 'settings' }, section: 'settings', label: 'Settings', icon: Settings, shortcut: 'go-settings' };

function NavLink({ entry, current }: { entry: Entry; current: Section | null }) {
  const selected = entry.section === current;
  const Icon = entry.icon;

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab or window) through to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(entry.route);
  }

  return (
    <a
      href={pathOf(entry.route)}
      className={styles.link}
      aria-current={selected ? 'page' : undefined}
      aria-label={entry.label}
      data-tooltip={withShortcut(entry.label, entry.shortcut)}
      onClick={onClick}
    >
      <Icon className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{entry.label}</span>
      <span className={styles.key} aria-hidden="true">
        {SHORTCUTS.find((s) => s.action === entry.shortcut)?.keys}
      </span>
    </a>
  );
}

/** Destinations on the left: icons and labels in wide windows, icons with tooltips below 960 px. */
export function Sidebar({ current }: { current: Section | null }) {
  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.brand}>
        <img src={orbitIcon} alt="" className={styles.logo} />
        <span className={styles.label}>Orbit</span>
      </div>
      <ul className={styles.list}>
        {MAIN.map((entry) => (
          <li key={entry.section}>
            <NavLink entry={entry} current={current} />
          </li>
        ))}
      </ul>
      <div className={styles.foot}>
        <NavLink entry={SETTINGS} current={current} />
      </div>
    </nav>
  );
}
