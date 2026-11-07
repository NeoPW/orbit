import { useSyncExternalStore } from 'react';

/** Below this width (CSS pixels) the app uses the phone layout. Keep in sync with the 639px media queries. */
export const PHONE_MAX_WIDTH = 639;
export const PHONE_QUERY = `(max-width: ${PHONE_MAX_WIDTH}px)`;

/** True for a window width that gets the phone layout. */
export function isPhoneWidth(width: number): boolean {
  return width <= PHONE_MAX_WIDTH;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function snapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia ? window.matchMedia(PHONE_QUERY).matches : isPhoneWidth(window.innerWidth);
}

/** Whether the phone layout applies: the Android app and any window narrower than 640 px. Follows resizing. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
