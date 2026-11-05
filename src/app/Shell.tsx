import { TriangleAlert } from 'lucide-react';
import { lazy, Suspense, type ComponentType } from 'react';
import { useRoute } from '../core/routing/useRoute.ts';
import type { RouteName } from '../core/routing/routes.ts';
import { MessageHost } from '../core/ui/messages/MessageHost.tsx';
import { HomeScreen } from '../features/home/ui/HomeScreen.tsx';
import { PlanScreen } from '../features/plan/ui/PlanScreen.tsx';
import { ReviewScreen } from '../features/review/ui/ReviewScreen.tsx';
import { SettingsScreen } from '../features/settings/ui/SettingsScreen.tsx';
import { useServices } from './services.ts';
import { Sidebar } from './Sidebar.tsx';
import styles from './Shell.module.css';

// The gallery is only imported in development; the production bundle has no trace of it.
const ComponentGallery: ComponentType | null = import.meta.env.DEV ? lazy(() => import('./dev/ComponentGallery.tsx')) : null;

const SCREENS: Record<Exclude<RouteName, 'dev-components'>, ComponentType> = {
  home: HomeScreen,
  plan: PlanScreen,
  review: ReviewScreen,
  settings: SettingsScreen,
};

export function Shell() {
  const route = useRoute();
  const { storage } = useServices();
  const Screen = route.name === 'dev-components' ? ComponentGallery : SCREENS[route.name];

  return (
    <div className={styles.shell}>
      <Sidebar current={route.name} />
      <div className={styles.main}>
        {storage === 'memory' && (
          <p className={styles.banner} role="alert">
            <TriangleAlert aria-hidden="true" />
            This browser offers no storage for Orbit: data is not saved and is lost when the page is closed.
          </p>
        )}
        <main className={styles.content}>
          <Suspense fallback={null}>{Screen && <Screen />}</Suspense>
        </main>
      </div>
      <MessageHost />
    </div>
  );
}
