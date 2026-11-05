/** A place in the app. Detail pages (`/projects/:id`, …) join this union later. */
export type Route = { name: 'home' } | { name: 'plan' } | { name: 'review' } | { name: 'settings' } | { name: 'dev-components' };

export type RouteName = Route['name'];

const PATHS: Record<RouteName, string> = {
  home: '/home',
  plan: '/plan',
  review: '/review',
  settings: '/settings',
  'dev-components': '/dev/components',
};

export const HOME: Route = { name: 'home' };

export function pathOf(route: Route): string {
  return PATHS[route.name];
}

export interface ParsedPath {
  route: Route;
  /** Set when the path is not the route's own path; the address bar should be replaced with it. */
  redirect?: string;
}

/**
 * Maps a pathname to a route. `/`, unknown paths and (outside development) the
 * dev-only gallery fall back to Home and ask for a redirect to `/home`.
 */
export function parsePath(pathname: string, options: { dev?: boolean } = {}): ParsedPath {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const [name, own] of Object.entries(PATHS) as [RouteName, string][]) {
    if (own !== path) continue;
    if (name === 'dev-components' && !options.dev) break;
    const route = { name } as Route;
    return own === pathname ? { route } : { route, redirect: own };
  }
  return { route: HOME, redirect: PATHS.home };
}
