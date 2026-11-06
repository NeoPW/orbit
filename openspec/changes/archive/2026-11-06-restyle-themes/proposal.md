# Proposal

## Why

The app works, but its look is the first guess: one navy theme, plain lists, no way to tell projects apart at a glance. After comparing 14 design mock-ups, the "Final" one was chosen: clean, modular, dark, with strong per-project colour coding and several colour themes to switch between, because the user does not want to decide on colours yet. This change applies it (`docs/SPEC.md` §6.7, §6.1, §6.4).

## What Changes

- **Colour themes:** five dark themes (Slate, Forest, Ember, Plum, Graphite) switchable live from the sidebar and from a new **Appearance** section in Settings. Only colours change; layout, type, spacing and radii are the same in every theme. The choice is a local setting, applied before the first paint so there is no flash of the wrong theme.
- **Project colour coding:**
  - Every project gets its own colour from an eight-colour palette of the theme: the least used colour at creation, changeable in the project form.
  - The colour is shown wherever the project appears: its tile and page header, its tasks and next steps (a chip and a rail), habit labels, the focus session and the goal's project list.
  - Goals choose their colour from the same palette; goal colours saved earlier stay valid.
- **Modular look:**
  - Cards and tiles with 14–20 px radii and 1 px borders, no textures.
  - Inter only (headings semibold, tabular numerals for timers); Space Grotesk is dropped.
  - Home, Plan, project, goal and task pages and focus mode are restyled to the mock-up: Home's tiles and project side column, Plan's goal cards with measures on the left and projects and open tasks on the right, a calm centred focus mode.
- **Schema:** `projects.color` (nullable) is added, so the schema version becomes 2. The sync server needs the matching migration (`npm run server:deploy`); until both are updated, sync waits ("different schema version").
- **BREAKING (spec):** the single navy palette and Space Grotesk headings are replaced; goal colours are palette slots instead of fixed hex values; the local database's "schema version is 1" becomes 2.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-design`:
  - "Orbit palette" is replaced by a per-theme dark palette.
  - "Typography" drops Space Grotesk.
  - New: "Colour themes", "Project colour coding" and "Modular tiles".
- `settings`: an **Appearance** section with the theme choice; the setting is stored locally.
- `projects`: a project has a colour; new projects get the least used one.
- `goals`: goal colour swatches are the theme palette.
- `local-database`: the schema gains `projects.color` and is at version 2.

## Out of scope

- The space photo background and translucent surfaces (still specified, not built).
- Light themes, and following the system's brightness setting.
- Custom colours (a colour picker for any hex) and user-made themes.
- Changing area colours: they stay the fixed hex palette shown as chips with a dot.
- New screens or features, and layout changes beyond the mock-up (Review and Settings only get the new tokens and tiles).
- Restyling the loading screen and the Android companion.

## Impact

- **Code:**
  - `src/core/ui/` (theme tokens, `themes.ts`, `colors.ts`, `ThemeSwitcher`, tile components, restyled components).
  - `src/features/{settings,projects,goals,tasks,home,plan,timer,review}/` (UI restyle; data for project colour).
  - `src/app/` (sidebar).
  - `index.html` (early theme script).
- **Database:** migration `0001` for the app (`drizzle/`) and the server (`npm run db:generate`, `npm run db:generate:server`).
- **Dependencies:** none.
- **Docs:** `docs/SPEC.md` (§4 Project, §6.7), `README.md` (server migration before syncing), `openspec/config.yaml` UI conventions.
