import { useSyncExternalStore } from 'react';
import { parsePath, pathOf, type Route } from './routes.ts';

// The current route lives in the address bar. Navigation inside the app pushes
// a history entry, so back and forward and reload work on the desktop and in
// the browser alike.

const NAVIGATE_EVENT = 'orbit:navigate';
const DEV = import.meta.env.DEV;

function subscribe(onChange: () => void): () => void {
  const onPop = () => {
    normalizeLocation();
    onChange();
  };
  window.addEventListener('popstate', onPop);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onPop);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

function currentPath(): string {
  return window.location.pathname;
}

/** Replaces `/`, unknown paths and trailing slashes with the route's own path, without a new history entry. */
export function normalizeLocation(): void {
  const { redirect } = parsePath(currentPath(), { dev: DEV });
  if (redirect !== undefined) window.history.replaceState(window.history.state, '', redirect);
}

export function navigate(route: Route): void {
  const path = pathOf(route);
  if (path === currentPath()) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, currentPath);
  return parsePath(path, { dev: DEV }).route;
}
