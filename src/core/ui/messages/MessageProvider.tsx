import { createContext, useContext, useState, type ReactNode } from 'react';
import { createMessenger, type Messenger } from './messenger.ts';

const MessengerContext = createContext<Messenger | null>(null);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messenger] = useState(() => createMessenger());
  return <MessengerContext.Provider value={messenger}>{children}</MessengerContext.Provider>;
}

/** The app's messenger: `show({ text, action })` for short confirmations. */
export function useMessages(): Messenger {
  const messenger = useContext(MessengerContext);
  if (!messenger) throw new Error('useMessages() needs a MessageProvider');
  return messenger;
}
