const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * The address to suggest in the connect form: the page's own address in the
 * browser build when it is served by the sync server, nothing on the desktop
 * or on a local development address.
 */
export function suggestedAddress(platform: 'desktop' | 'browser', location: { origin: string; hostname: string }): string {
  if (platform === 'desktop') return '';
  return LOCAL_HOSTS.has(location.hostname) ? '' : location.origin;
}
