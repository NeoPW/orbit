import { CalendarClock, House, Settings, type LucideIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { navigate } from '../core/routing/useRoute.ts';
import { pathOf, type Route, type Section } from '../core/routing/routes.ts';
import styles from './BottomNav.module.css';

interface Entry {
  route: Route;
  section: Section;
  label: string;
  icon: LucideIcon;
}

/** The phone's destinations; Plan and Review are desktop screens. */
const ENTRIES: Entry[] = [
  { route: { name: 'home' }, section: 'home', label: 'Home', icon: House },
  { route: { name: 'today' }, section: 'today', label: 'Today', icon: CalendarClock },
  { route: { name: 'settings' }, section: 'settings', label: 'Settings', icon: Settings },
];

/** Navigation at the bottom of the phone layout, above the system's gesture bar. */
export function BottomNav({ current }: { current: Section | null }) {
  function onClick(event: MouseEvent<HTMLAnchorElement>, route: Route) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(route);
  }

  return (
    <nav className={styles.nav} aria-label="Main">
      {ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return (
          <a
            key={entry.section}
            href={pathOf(entry.route)}
            className={styles.link}
            aria-current={entry.section === current ? 'page' : undefined}
            onClick={(event) => onClick(event, entry.route)}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span>{entry.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
