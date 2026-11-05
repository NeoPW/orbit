# Design

## Context

`src/App.tsx` is the placeholder from `local-database` and `sync-client`. It does four things:
- opens the database;
- counts app starts;
- shows the storage, other-tab and error states inline;
- mounts `SyncPanel`, which creates the sync scheduler itself, and `TestAreas`.

The components use inline styles. There is no router and no DOM test environment: Vitest runs in `node`. The desktop window is at least 800 × 600, and the browser build is served by the Worker with SPA fallback (`not_found_handling: single-page-application`).

## Goals / Non-Goals

**Goals:**
- A frame that later feature changes only plug screens and routes into.
- Pure, tested logic for routing, messages, dates and deadline badges.
- Components small enough to adapt when features use them.

**Non-Goals:**
- A component library in its own right. Variants are added when a feature needs them.
- Detail routes (`/projects/:id`, …). The route type is shaped so they can be added later.

## Decisions

### Folder layout
- `src/app/` holds the shell:
  - `AppRoot`: database loading, services context, sync runner;
  - `Shell`: sidebar, content area, message host, storage banner;
  - `StartScreen`: loading, other tab, error.
- Screens live in their features: `src/features/{home,plan,review,settings}/ui/*Screen.tsx`. Feature changes then fill their own folder.
- Shared UI goes in `src/core/ui/`. Routing goes in `src/core/routing/`. Date and deadline logic goes in `src/core/dates/`.

### Own router instead of react-router
- `routes.ts` holds pure functions:
  - `parsePath(pathname) → { route, redirect? }`, which redirects `/` and unknown paths to `/home`;
  - `pathOf(route)`.
- `useRoute()` reads `location.pathname` through `useSyncExternalStore` (`popstate` plus a local event). `navigate(route)` calls `pushState`.
- Four routes do not justify a dependency. The `Route` union grows with detail pages later.
- Alternatives:
  - react-router: large API and data-router concepts we don't use.
  - Hash routing: ugly URLs, and the Worker already does SPA fallback.

### Styling: CSS custom properties + CSS Modules
- `src/core/ui/theme.css` defines the tokens: colors, area accents, spacing, radii, type scale, motion durations. It also holds the `@font-face` rules for the bundled fonts in `assets/fonts/` and the base styles. Each component has a `*.module.css` file.
- This needs no dependency: Vite supports CSS Modules natively. Fonts referenced from CSS are bundled by Vite, so nothing loads from the network.
- Global rules:
  - `@media (prefers-reduced-motion: reduce)` sets the motion tokens to `0ms`;
  - `:focus-visible` draws the focus ring.
- Alternatives:
  - Tailwind: a new toolchain and config.
  - CSS-in-JS: runtime cost and a dependency.

### Icons: `lucide-react`
- Tree-shaken ESM: only the imported icons are bundled.
- ISC license, consistent stroke style, bundled with the app, no network.
- Alternative: hand-drawn SVGs. That means more work and an inconsistent look.

### Sheets and dialogs on native `<dialog>`
- `Sheet` and `ConfirmDialog` use `showModal()`. That gives the top layer, an inert background, focus containment and Escape (the `cancel` event) without extra code.
- The sheet wraps its content in a `<form>`. Enter in a single-line field submits it natively; a `<textarea>` keeps Enter for new lines.
- The form state lives in the sheet's children and is dropped when the sheet closes. Closing without saving therefore discards changes.
- Alternative: a portal with a custom focus trap. Same result, more code, easier to get wrong.

### Messages as a small store
- `createMessenger({ durationMs = 3000 })` holds the current message and one timer. It offers `show`, `dismiss`, `pause` and `resume`:
  - `show` replaces the current message and restarts the full duration;
  - `resume` restarts the full duration, so the message closes 3 s after the pointer leaves;
  - the action handler runs the action, then calls `dismiss`.
- React reaches it through `MessageProvider`/`useMessages()` (`useSyncExternalStore`). `MessageHost` renders the card in a `role="status"` live region and calls pause/resume on pointer enter/leave and focus in/out.
- The logic is tested with fake timers, without the DOM.

### Dates and deadline badges
- `formatDate('2026-03-05') → '05-03-2026'` and `formatDateRange(a, b)` work on the stored `yyyy-mm-dd` strings directly, so they are locale and time-zone independent.
- `daysUntil(date, today)` does whole-day arithmetic on those strings.
- `deadlineBadge(deadline, today, leadDays) → { label, tone: 'overdue' | 'soon' | 'none' }`.
- The lead time is a parameter. Until the Settings feature stores it, callers pass `DEFAULT_LEAD_DAYS = 7`, which is exported next to the function.

### Sync runs at shell level
The scheduler is created in `SyncPanel` today, so it would stop as soon as Settings is left.
- It moves to a `SyncRunner` that `AppRoot` mounts once. It exposes the scheduler, the sync state and a data version through context.
- `SyncPanel` becomes the Settings "Sync" section and only reads that context and calls `syncNow`.
- `TestAreas` (shown on Plan) refreshes on the data version, as before.

### Services context instead of props
`AppRoot` provides `{ db, driver, onWrite, storage }` through `ServicesContext` to screens. Screens pass `db` on to repositories, which keeps the rule "UI never talks to the database directly". The start counter (`app_starts`) is dropped; it only served the placeholder.

### Loading screen
- `index.html` puts the night-sky background and the planet image inline inside `#root`. React's first render replaces them.
- On the desktop, the window's `backgroundColor` in `src-tauri/tauri.conf.json` is set to the navy color, so the window shows no white flash before the webview paints.

### Testing and the component gallery
- Spec scenarios with logic are unit-tested as pure functions: routes, messenger, date format, deadline badge.
- Layout, focus rings, sheets and fonts are checked by hand. To make that quick, a dev-only route `/dev/components` (only when `import.meta.env.DEV`) shows every shared component in its states.
- No jsdom or Testing Library yet. They are added with the first feature that needs component tests.

## Risks / Trade-offs

- [The Tauri asset server might not fall back to `index.html` on reload at `/plan`] → Verify on a release build. If it doesn't, start the desktop app at `/` and keep the current route only in memory there.
- [Native `<dialog>` and `:focus-visible` in WebKitGTK] → Both are supported in the WebKitGTK versions Tauri 2 requires. They are checked in the desktop verification task.
- [Escape discards a half-filled form without asking] → This is what §6.7 asks for. Forms are short. Revisit if it bites in practice.
- [No component tests] → Behavior with logic lives in pure modules with tests. The gallery makes the manual check cheap.

## Migration Plan

Frontend only, no data migration. Rollback is reverting the change.
