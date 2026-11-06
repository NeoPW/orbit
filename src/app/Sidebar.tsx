import { CalendarRange, House, NotebookPen, Settings, type LucideIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import orbitIcon from '../../assets/icon/orbit.png';
import { navigate } from '../core/routing/useRoute.ts';
import { pathOf, type Route, type Section } from '../core/routing/routes.ts';
import { ThemeSwitcher } from '../core/ui/components/ThemeSwitcher.tsx';
import { useSettings } from '../features/settings/data/settings.ts';
import styles from './Sidebar.module.css';

interface Entry {
  route: Route;
  section: Section;
  label: string;
  icon: LucideIcon;
}

const MAIN: Entry[] = [
  { route: { name: 'home' }, section: 'home', label: 'Home', icon: House },
  { route: { name: 'plan' }, section: 'plan', label: 'Plan', icon: CalendarRange },
  { route: { name: 'review' }, section: 'review', label: 'Review', icon: NotebookPen },
];

const SETTINGS: Entry = { route: { name: 'settings' }, section: 'settings', label: 'Settings', icon: Settings };

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
      data-tooltip={entry.label}
      onClick={onClick}
    >
      <Icon className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{entry.label}</span>
    </a>
  );
}

/** Destinations on the left: icons and labels in wide windows, icons with tooltips below 960 px. */
export function Sidebar({ current }: { current: Section | null }) {
  const { settings, save } = useSettings();
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
        <div className={styles.themes}>
          <ThemeSwitcher value={settings.theme} onChange={(id) => void save('theme', id)} />
        </div>
        <NavLink entry={SETTINGS} current={current} />
      </div>
    </nav>
  );
}
