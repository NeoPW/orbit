import { CalendarRange, House, NotebookPen, Settings, type LucideIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import orbitIcon from '../../assets/icon/orbit.png';
import { navigate } from '../core/routing/useRoute.ts';
import { pathOf, type Route, type RouteName } from '../core/routing/routes.ts';
import styles from './Sidebar.module.css';

interface Entry {
  route: Route & { name: RouteName };
  label: string;
  icon: LucideIcon;
}

const MAIN: Entry[] = [
  { route: { name: 'home' }, label: 'Home', icon: House },
  { route: { name: 'plan' }, label: 'Plan', icon: CalendarRange },
  { route: { name: 'review' }, label: 'Review', icon: NotebookPen },
];

const SETTINGS: Entry = { route: { name: 'settings' }, label: 'Settings', icon: Settings };

function NavLink({ entry, current }: { entry: Entry; current: RouteName }) {
  const selected = entry.route.name === current;
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
export function Sidebar({ current }: { current: RouteName }) {
  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.brand}>
        <img src={orbitIcon} alt="" className={styles.logo} />
        <span className={styles.label}>Orbit</span>
      </div>
      <ul className={styles.list}>
        {MAIN.map((entry) => (
          <li key={entry.route.name}>
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
