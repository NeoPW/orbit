/** A place in the app. */
export type Route =
  | { name: 'home' }
  /** The day timeline on its own screen (phone layout only). */
  | { name: 'today' }
  | { name: 'plan' }
  /** The Review tab; `week` (a Monday, `yyyy-mm-dd`) is kept in the address (`?week=`), the current week when missing. */
  | { name: 'review'; week?: string }
  | { name: 'settings' }
  | { name: 'goal'; id: string }
  | { name: 'project'; id: string }
  | { name: 'task'; id: string }
  /** The guided review; `step` is kept in the address (`?step=`) so reload returns to it. */
  | { name: 'review-flow'; step?: string }
  | { name: 'review-history'; id: string }
  | { name: 'focus' }
  | { name: 'dev-components' };

export type RouteName = Route['name'];

/** The sidebar destination a route belongs to. */
export type Section = 'home' | 'today' | 'plan' | 'review' | 'settings';

/** Routes without parameters, by path. */
const STATIC_PATHS = {
  home: '/home',
  today: '/today',
  plan: '/plan',
  review: '/review',
  settings: '/settings',
  'review-flow': '/review/flow',
  focus: '/focus',
  'dev-components': '/dev/components',
} as const;

/** Routes with an id as last path segment, by path prefix. */
const ID_PREFIXES = {
  goal: '/goals/',
  project: '/projects/',
  task: '/tasks/',
  'review-history': '/review/history/',
} as const;

type StaticName = keyof typeof STATIC_PATHS;
type IdName = keyof typeof ID_PREFIXES;

export const HOME: Route = { name: 'home' };

export function pathOf(route: Route): string {
  if (route.name in ID_PREFIXES) {
    const { name, id } = route as Extract<Route, { name: IdName }>;
    return ID_PREFIXES[name] + encodeURIComponent(id);
  }
  const path = STATIC_PATHS[route.name as StaticName];
  if (route.name === 'review-flow' && route.step) return `${path}?step=${encodeURIComponent(route.step)}`;
  if (route.name === 'review' && route.week) return `${path}?week=${encodeURIComponent(route.week)}`;
  return path;
}

/** The sidebar destination for a route; `null` for the dev gallery. Details belong to Plan, review pages to Review. */
export function sectionOf(route: Route): Section | null {
  switch (route.name) {
    case 'home':
    case 'focus':
      return 'home';
    case 'plan':
    case 'goal':
    case 'project':
    case 'task':
      return 'plan';
    case 'review':
    case 'review-flow':
    case 'review-history':
      return 'review';
    case 'today':
      return 'today';
    case 'settings':
      return 'settings';
    case 'dev-components':
      return null;
  }
}

export interface ParsedPath {
  route: Route;
  /** Set when the path is not the route's own path; the address bar should be replaced with it. */
  redirect?: string;
}

/**
 * Maps a location (`pathname`, optionally followed by `?query`) to a route.
 * `/`, unknown paths and (outside development) the dev-only gallery fall back
 * to Home and ask for a redirect to `/home`.
 */
export function parsePath(location: string, options: { dev?: boolean } = {}): ParsedPath {
  const [pathname = '', query = ''] = location.split('?', 2);
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const route = routeOfPath(path, new URLSearchParams(query), options.dev ?? false);
  if (!route) return { route: HOME, redirect: STATIC_PATHS.home };
  if (path === pathname) return { route };
  return { route, redirect: pathOf(route) };
}

function routeOfPath(path: string, query: URLSearchParams, dev: boolean): Route | null {
  for (const [name, own] of Object.entries(STATIC_PATHS) as [StaticName, string][]) {
    if (own !== path) continue;
    if (name === 'dev-components' && !dev) return null;
    if (name === 'review-flow') {
      const step = query.get('step');
      return step ? { name, step } : { name };
    }
    if (name === 'review') {
      const week = query.get('week');
      return week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? { name, week } : { name };
    }
    return { name } as Route;
  }
  for (const [name, prefix] of Object.entries(ID_PREFIXES) as [IdName, string][]) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (rest === '' || rest.includes('/')) return null;
    try {
      return { name, id: decodeURIComponent(rest) };
    } catch {
      return null;
    }
  }
  return null;
}
