import { useEffect, useState } from 'react';
import { openAppDatabase } from '../core/db/app-database.ts';
import { normalizeLocation } from '../core/routing/useRoute.ts';
import { MessageProvider } from '../core/ui/messages/MessageProvider.tsx';
import { useSettings } from '../features/settings/data/settings.ts';
import { applyTheme, mirroredTheme } from '../core/ui/themes.ts';
import { AndroidReminderRunner } from '../features/notifications/ui/AndroidReminderRunner.tsx';
import { ReminderRunner } from '../features/notifications/ui/ReminderRunner.tsx';
import { platform } from '../platform/platform.ts';
import { SyncRunner } from '../features/sync/ui/SyncRunner.tsx';
import { ServicesContext, type Services } from './services.ts';
import { Shell } from './Shell.tsx';
import { StartScreen, type StartState } from './StartScreen.tsx';

type LoadState = StartState | { kind: 'ready'; services: Services };

async function load(): Promise<LoadState> {
  const result = await openAppDatabase();
  if (result.status === 'other-tab') return { kind: 'other-tab' };
  if (result.status === 'error') return { kind: 'error', message: result.message };
  const { db, driver, onWrite, storage } = result;
  return { kind: 'ready', services: { db, driver, onWrite, storage } };
}

/** Opens the database, then shows the shell, or a full-window start screen until then. */
export function AppRoot() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    normalizeLocation();
    let active = true;
    void load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.kind !== 'ready') return <StartScreen state={state} />;

  return <ReadyApp services={state.services} />;
}

/** Applies the stored theme once the settings are read (the mirror in localStorage may be missing or stale). */
function ThemeApplier() {
  const { settings, loaded } = useSettings();
  useEffect(() => {
    if (loaded && settings.theme !== mirroredTheme()) applyTheme(settings.theme);
  }, [loaded, settings.theme]);
  return null;
}

function ReadyApp({ services }: { services: Services }) {
  return (
    <ServicesContext.Provider value={services}>
      <MessageProvider>
        <ThemeApplier />
        <SyncRunner driver={services.driver} onWrite={services.onWrite}>
          {platform === 'android' ? <AndroidReminderRunner /> : <ReminderRunner />}
          <Shell />
        </SyncRunner>
      </MessageProvider>
    </ServicesContext.Provider>
  );
}
