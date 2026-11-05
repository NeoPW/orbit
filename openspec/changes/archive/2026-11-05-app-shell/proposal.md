# Proposal

## Why

The app still opens on the placeholder start screen from `local-database` and `sync-client`. It has no navigation, no theme and no common building blocks. Every feature batch in milestone 5 (`docs/SPEC.md` §9) needs those first. This change is milestone 4. It sets up the frame and the visual language that §6 and §6.7 leave to "the app shell change". By decision, it is kept as one change, even though it is larger than the usual size limit.

## What Changes

- **Theme** (§6.7):
  - Dark only, with the Orbit palette as design tokens: deep navy surfaces, blue-violet primary, cyan secondary, amber for urgency, red for overdue, and the area colors.
  - Bundled Inter for body text and Space Grotesk for headings.
  - Visible keyboard focus.
  - No animation when the system asks for reduced motion.
- **Navigation** (§6):
  - A sidebar on the left with Home, Plan and Review, and Settings at its foot.
  - Icons with labels in wide windows; icons only below 960 px.
  - Each destination has its own path (`/home`, `/plan`, `/review`, `/settings`). Reload, back and forward keep the place. `/` and unknown paths open Home.
- **Screens:**
  - Home, Plan and Review get a page header and an empty state until their feature changes fill them.
  - Settings gets the **Sync** section: the sync panel moves there from the start screen and is restyled.
  - The test areas list (for checking sync by hand) moves to the Plan screen until the areas feature replaces it.
  - The start screen is removed.
- **Start states:**
  - While the app loads, the page shows the night sky with the planet.
  - When the database cannot be opened, a full-window message with the reason is shown.
  - "Open in another tab" also gets a full-window message.
  - The browser storage warning becomes a persistent banner.
- **Shared components:** page header, button, icon button, text field, chip (status, area), importance dots, deadline badge, empty state, side sheet for forms (Enter saves, Escape closes without saving) and a confirmation dialog.
- **Display rules:**
  - Dates as `dd-mm-yyyy`, ranges as `dd-mm-yyyy – dd-mm-yyyy`.
  - Deadline badges read "Overdue", "Today", "Tomorrow" or "In N days" within the lead time (amber, red when overdue), otherwise the date.
- **Messages** (§6.7):
  - A compact card at the top of the window with an icon, one line and an optional action such as Undo.
  - It closes on its own after 3 seconds; hovering or focusing it pauses that.
  - It has a close button, and a new message replaces the current one.
- **BREAKING (spec):**
  - The Android/phone parts of `app-shell` and `visual-design` give way to the desktop and browser: bottom bar, swipe to dismiss, bottom sheets, Android launch screen.
  - The redirects from former objective/key result addresses are removed.
  - Settings is opened from the navigation instead of a top-bar button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`:
  - "Runs on Android and web" is replaced by "Runs on the desktop and in the browser".
  - Destinations become Home, Plan, Review plus Settings.
  - "Responsive navigation" (bottom bar or rail) is replaced by "Sidebar navigation", which collapses to icons.
  - Paths add `/settings`.
  - The theme is no longer Material 3.
  - New: a database error at start.
  - Removed: former objective/key result addresses.
- `visual-design`:
  - Palette and typography are restated for desktop and browser; red is added for overdue.
  - "Messages at the top" is replaced by "Message cards": close button and pause on hover instead of swipe.
  - Forms: a side sheet instead of a bottom sheet (full width below 600 px), Enter saves and Escape closes.
  - "App icon and launch screen" is replaced by "App icon and loading screen" for desktop and browser.
  - New: deadline badge text and visible keyboard focus.
  - Removed: sheets clear of system and tab bars.
- `settings`: the Settings screen is reached from the navigation and its connection section is called "Sync".

## Out of scope

- Content of Home, Plan, Review and the Settings reminder fields. These come with their feature changes; the `settings` delta only changes how the screen is reached and its section name.
- Date and time fields and pickers. They come with the first form that has a date (goals).
- Menus, list animations and detail-page transitions. They come with the first list or detail page that needs them. Only the reduced-motion rule is set here.
- The space photo background, translucent surfaces and the Space images setting. These stay in the specs for a later change; this change uses the plain navy background.
- Keyboard shortcuts for switching destinations, and orbit progress rings.
- The Android companion.

## Impact

- **Code:**
  - New: `src/core/ui/` (tokens, fonts, components, messages, date format), `src/core/routing/` (paths and navigation), `src/app/` (shell, sidebar, start states, screens).
  - `src/App.tsx` and `src/main.tsx` are replaced by the shell.
  - `src/features/sync/ui/` is restyled and mounted in Settings.
  - `index.html` gets the loading screen.
- **Dependencies:** `lucide-react` (icons). No router or UI library.
- **Docs:**
  - `docs/SPEC.md` §6 (navigation line) and §6.7 ("redefined in the app shell change") need updating to describe the result.
  - The UI conventions note in `openspec/config.yaml` ("redefined in the app-shell change") needs updating too.
