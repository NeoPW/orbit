import { useEffect, useState } from 'react';
import { openAppDatabase } from '../core/db/app-database.ts';
import { normalizeLocation } from '../core/routing/useRoute.ts';
import { MessageProvider } from '../core/ui/messages/MessageProvider.tsx';
import { ReminderRunner } from '../features/notifications/ui/ReminderRunner.tsx';
import { SyncRunner } from '../features/sync/ui/SyncRunner.tsx';
import { useNotificationClicks } from './useNotificationClicks.ts';
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

function ReadyApp({ services }: { services: Services }) {
  useNotificationClicks();
  return (
    <ServicesContext.Provider value={services}>
      <MessageProvider>
        <SyncRunner driver={services.driver} onWrite={services.onWrite}>
          <ReminderRunner />
          <Shell />
        </SyncRunner>
      </MessageProvider>
    </ServicesContext.Provider>
  );
}
