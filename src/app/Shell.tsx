import { TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { navigate, useRoute } from '../core/routing/useRoute.ts';
import { useIsPhone } from '../core/ui/useIsPhone.ts';
import { sectionOf, type RouteName } from '../core/routing/routes.ts';
import { MessageHost } from '../core/ui/messages/MessageHost.tsx';
import { GoalPage } from '../features/goals/ui/GoalPage.tsx';
import { HomeScreen } from '../features/home/ui/HomeScreen.tsx';
import { ProjectPage } from '../features/projects/ui/ProjectPage.tsx';
import { PlanScreen } from '../features/plan/ui/PlanScreen.tsx';
import { ReviewFlow } from '../features/review/ui/ReviewFlow.tsx';
import { ReviewHistoryPage } from '../features/review/ui/ReviewHistoryPage.tsx';
import { ReviewScreen } from '../features/review/ui/ReviewScreen.tsx';
import { SettingsScreen } from '../features/settings/ui/SettingsScreen.tsx';
import { CompleteTaskProvider } from '../features/tasks/ui/CompleteTaskProvider.tsx';
import { TaskPopupProvider } from '../features/tasks/ui/TaskPopup.tsx';
import { TaskPage } from '../features/tasks/ui/TaskPage.tsx';
import { FocusMode } from '../features/timer/ui/FocusMode.tsx';
import { TodayScreen } from '../features/timeline/ui/TodayScreen.tsx';
import { NotFound } from './NotFound.tsx';
import { useServices } from './services.ts';
import { Sidebar } from './Sidebar.tsx';
import { BottomNav } from './BottomNav.tsx';
import styles from './Shell.module.css';
import { AppSheets } from './shortcuts/AppSheets.tsx';
import { ShortcutProvider } from './shortcuts/ShortcutProvider.tsx';

// The gallery is only imported in development; the production bundle has no trace of it.
const ComponentGallery: ComponentType | null = import.meta.env.DEV ? lazy(() => import('./dev/ComponentGallery.tsx')) : null;

// Page of each route. A page reads its parameters with `useRoute()`. A route
// without an entry shows NotFound; later changes add their pages here.
const SCREENS: Partial<Record<RouteName, ComponentType>> = {
  home: HomeScreen,
  today: TodayScreen,
  plan: PlanScreen,
  goal: GoalPage,
  project: ProjectPage,
  task: TaskPage,
  review: ReviewScreen,
  'review-flow': ReviewFlow,
  'review-history': ReviewHistoryPage,
  settings: SettingsScreen,
  'dev-components': ComponentGallery ?? undefined,
};

export function Shell() {
  const route = useRoute();
  const { storage } = useServices();
  const isPhone = useIsPhone();
  const Screen = SCREENS[route.name] ?? NotFound;

  // The Today screen exists only in the phone layout; wide windows show the timeline on Home.
  const todayOnWide = route.name === 'today' && !isPhone;
  useEffect(() => {
    if (todayOnWide) navigate({ name: 'home' });
  }, [todayOnWide]);

  // Focus mode fills the window without the sidebar or the bottom navigation.
  if (route.name === 'focus') {
    return (
      <CompleteTaskProvider>
        <TaskPopupProvider>
          <AppSheets>
            <ShortcutProvider>
              <div className={styles.fullWindow}>
                <FocusMode />
              </div>
            </ShortcutProvider>
          </AppSheets>
        </TaskPopupProvider>
        <MessageHost />
      </CompleteTaskProvider>
    );
  }

  return (
    <CompleteTaskProvider>
      <TaskPopupProvider>
        <AppSheets>
          <ShortcutProvider>
            <div className={`${styles.shell} ${isPhone ? styles.phone : ''}`}>
              {!isPhone && <Sidebar current={sectionOf(route)} />}
              <div className={styles.main}>
                {storage === 'memory' && (
                  <p className={styles.banner} role="alert">
                    <TriangleAlert aria-hidden="true" />
                    This browser offers no storage for Orbit: data is not saved and is lost when the page is closed.
                  </p>
                )}
                <main className={styles.content}>
                  <Suspense fallback={null}>
                    <Screen />
                  </Suspense>
                </main>
              </div>
              {isPhone && <BottomNav current={sectionOf(route)} />}
              <MessageHost />
            </div>
          </ShortcutProvider>
        </AppSheets>
      </TaskPopupProvider>
    </CompleteTaskProvider>
  );
}
