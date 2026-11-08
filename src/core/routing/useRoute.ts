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

/** Path and query: the query carries the review step. */
function currentLocation(): string {
  return window.location.pathname + window.location.search;
}

/** Replaces `/`, unknown paths and trailing slashes with the route's own path, without a new history entry. */
export function normalizeLocation(): void {
  const { redirect } = parsePath(currentLocation(), { dev: DEV });
  if (redirect !== undefined) window.history.replaceState(window.history.state, '', redirect);
}

/** Position of the current history entry among the ones the app pushed (0 for the entry the app was opened on). */
function historyIndex(): number {
  const state = window.history.state as { orbit?: number } | null;
  return state?.orbit ?? 0;
}

export function navigate(route: Route): void {
  const path = pathOf(route);
  if (path === currentLocation()) return;
  window.history.pushState({ orbit: historyIndex() + 1 }, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** Goes back to the screen the current one was opened from, or to `fallback` when it was opened directly by its address. */
export function goBack(fallback: Route): void {
  if (historyIndex() > 0) window.history.back();
  else navigate(fallback);
}

export function useRoute(): Route {
  const path = useSyncExternalStore(subscribe, currentLocation);
  return parsePath(path, { dev: DEV }).route;
}
