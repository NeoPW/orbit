import { createContext, useContext } from 'react';
import type { Storage } from '../core/db/database.ts';
import type { Db } from '../core/db/drizzle.ts';
import type { SqlDriver } from '../platform/db/driver.ts';

/** What screens need from the opened database; screens hand `db` to repositories. */
export interface Services {
  db: Db;
  /** Raw driver without write notification, for sync. */
  driver: SqlDriver;
  /** Subscribes to writes of synced tables made through `db`. */
  onWrite: (listener: () => void) => () => void;
  storage: Storage;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices() needs the ServicesContext of AppRoot');
  return services;
}
