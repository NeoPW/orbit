# Tasks

Run under Node 24 (`fnm use`). Each group ends with `npx tsc --noEmit` and its own tests passing; the full `npm run check` runs once, in 4.2. The reference layout is in `mockups/` (copy the theme table values from the top of `renderVals()` in `final-home.dc.html`).

## 1. Themes

- [x] 1.1 Rework `src/core/ui/theme.css`:
  - define every token per theme: Slate in `:root`, then `[data-theme='forest']`, `ember`, `plum`, `graphite`;
  - add `--color-sidebar`, `--color-overdue-bg`, `--color-soon-bg` and `--pc0…--pc7`;
  - derive hover, sheet, soft, strong, secondary, faint and focus tokens with `color-mix()`;
  - drop the Space Grotesk `@font-face`, set headings to Inter 600 and add `tabular-nums` to numerals.

  Add `src/core/ui/themes.ts` (`THEMES`, `ThemeId`, swatch colours). In `themes.test.ts` parse `theme.css` and test "Contrast in every theme" (text and muted ≥ 4.5 on bg, surface and raised; each `pc` ≥ 3 on surface).
- [x] 1.2 Add the `theme` key (default `slate`, validated) to `src/features/settings/data/settings.ts`. Add `applyTheme(id)` (sets `data-theme`, mirrors to `localStorage` `orbit-theme`) and apply it when settings load and change. Add the inline script to `index.html` that sets `data-theme` from the mirror before React starts. Test "Default" and "Kept across restarts" (save and read, invalid id rejected) in `settings.test.ts`.
- [x] 1.3 Add `src/core/ui/components/ThemeSwitcher.tsx` (swatch buttons, name as accessible label, `aria-pressed`). Mount it in the sidebar foot (`src/app/Sidebar.tsx`) and as the Appearance section of `src/features/settings/ui/SettingsScreen.tsx` (swatches with names). Add it to the component gallery. Check "Switch live" and "Choose a theme" in the browser.

## 2. Project colour

- [x] 2.1 Add `color` (nullable text) to `projects` in `src/core/db/schema.ts`. Run `npm run db:generate` and `npm run db:generate:server`. Update the tests that expect schema version 1 (`migrate.test.ts`, `database.test.ts`, server tests) and add a test for "Colour column added to projects" (a version-1 database with a project migrates, the project is unchanged and its colour is empty).
- [x] 2.2 Add `src/core/ui/colors.ts`: `SLOTS`, `slotColor`, `isSlot`, `pickSlot`, `projectColor` (stored slot, else hash of the id) and `goalColor` (stored slot, legacy hex as it is, else the slot for its position). Replace `GOAL_COLORS` in `palette.ts` with the slots and keep `AREA_COLORS`. Test "Colours differ", "Least used first", "Older project", "Older goal colour" and "Back to Auto" in `colors.test.ts` (and adjust `palette.test.ts`).
- [x] 2.3 In `src/features/projects/data/projects-repository.ts`:
  - `createProject` picks the colour with `pickSlot`;
  - `updateProject` saves a chosen colour;
  - `ProjectInput` and `ProjectView` carry it.

  Add the project's colour to the task and Home queries (`TaskView`, `src/features/home/data/home-queries.ts`). Test "Colours differ" and "Change the colour" in `projects-repository.test.ts`.
- [x] 2.3a Add the colour choice (eight swatches, no "Auto") to `ProjectSheet.tsx`, and make `GoalSheet.tsx` offer the slots plus "Auto" (a legacy hex colour stays shown as selected). Check "Change the colour" and "Pick a color" in the browser.

## 3. Restyle

- [x] 3.1 Add `Tile` (radius 16 px, 1 px border, optional `--pc` rail and tinted header) and the `project` variant of `Chip` (tint by `color-mix`, dot and name). Restyle `Section`, `ListRow`, `ProgressBar`, `PageHeader` and the sidebar (selected state as an accent-tinted pill, theme switcher in the foot) with the new tokens. Add the variants to the gallery; check them in two themes.
- [x] 3.2 Restyle Home (`HomeScreen.module.css` and markup as needed): the focus panel tile with the project chip, habit chips with a project dot, To do rows (`TaskRow` gets `projectColor` and `projectName`: chip and rail), and the Active projects tiles with colour rail, header tint and next-step rows. Check "Task row", "Same colour on every screen" and "Standalone task" on Home.
- [x] 3.3 Restyle Plan as the mock-up: goal cards (goal colour header, progress, measures left, project tiles and open task rows right), Projects without a goal, Backlog with filter chips, Habits as a list with link chips, Areas as tiles, Archive. Check "Plan goal card" and "No decoration".
- [x] 3.4 Restyle the project page, goal page and task page headers and sections with `Tile` and the project colour (header tint, rail), and the Review and Settings screens with the new tokens and tiles (no layout changes). Check "Colour follows the theme" on a project page.
- [x] 3.5 Restyle focus mode as the mock-up: centred, the project chip, large tabular timer, progress in the project colour, notes tile, Stop (accent) and Discard; the theme switcher at the top right. Check "Steady timer".

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md` (§4 Project gains `color`; §6.7 visual identity: themes, project colour coding, modular tiles, Inter only), `README.md` (migrate the server before syncing: `npm run server:deploy`) and the UI conventions note in `openspec/config.yaml`.
- [x] 4.2 Run `npm run check`; it must pass.
- [x] 4.3 Verify in `npm run dev` and `npm run desktop`: Home, Plan and Focus in each of the five themes (switch from the sidebar and Settings; restart keeps the theme with no flash), projects keep their colour on every screen, an older database (schema version 1) opens and migrates, and sync against a version-1 server says "different schema version" and recovers after `npm run server:deploy`.
