import type { Platform } from '../../../platform/platform.ts';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * The address to suggest in the connect form: the page's own address in the
 * browser build when it is served by the sync server, nothing in the desktop or
 * Android app or on a local development address.
 */
export function suggestedAddress(platform: Platform, location: { origin: string; hostname: string }): string {
  if (platform !== 'browser') return '';
  return LOCAL_HOSTS.has(location.hostname) ? '' : location.origin;
}
