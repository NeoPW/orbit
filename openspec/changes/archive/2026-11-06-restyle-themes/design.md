# Design

## Context

`src/core/ui/theme.css` defines one set of tokens (`--color-bg`, `--color-surface`, `--color-primary`, `--color-amber`, `--color-red`, …) that all 37 CSS modules use. Colours that are not tokens (area and goal colours) are hex values stored in the database and in `src/core/ui/palette.ts`. The schema has one migration (`0000_init`); `SCHEMA_VERSION` is the number of migrations, and sync only runs between equal versions. Settings live in the local `settings` table behind `useSettings()`.

The target look is in `mockups/final-{home,plan,focus}.dc.html` (kept in this change, because the originals are only a session artefact). Each file has the layout, the spacing and a theme table at the top of its `renderVals()`: `name, bg, sidebar, surface, raised, border, text, muted, accent, on-accent, overdue, overdue-bg, soon, soon-bg, pc0…pc7`. Those tables are the source of the colour values; the apply step copies them.

## Goals / Non-Goals

**Goals:**
- Switching theme is a pure token swap: no component knows which theme is active.
- A project's colour is one value used by every component through one helper.
- No flash of the default theme at start.

**Non-Goals:**
- Custom colours and light themes.
- Changing component behaviour. Only markup structure and CSS change where the mock-up needs a different layout.

## Decisions

### Themes are CSS custom properties on `<html data-theme="…">`
- `theme.css` keeps the token names it has, now defined per theme: the default (Slate) in `:root`, the four others in `[data-theme='forest']` and so on. Existing CSS modules therefore need no change for colours.
- Mapping from the mock-up's table: `bg → --color-bg`, `sidebar → --color-sidebar` (new), `surface → --color-surface`, `raised → --color-surface-raised`, `border → --color-border`, `text → --color-text`, `muted → --color-text-muted`, `accent → --color-primary`, `on-accent → --color-on-primary`, `overdue → --color-red`, `soon → --color-amber`; new `--color-overdue-bg` and `--color-soon-bg`; `pc0…pc7 → --pc0…--pc7`.
- Derived tokens (`--color-surface-hover`, `--color-sheet`, `--color-primary-soft`, `--color-red-soft`, `--color-amber-soft`, `--color-text-faint`) are computed with `color-mix()` from the base tokens, so a theme defines about 22 values only.
- `src/core/ui/themes.ts` holds the metadata (id, name, ground, accent: for the swatches) and the type `ThemeId`. The colour values live only in the CSS.
- **Test:** `themes.test.ts` reads `theme.css`, parses each theme block and checks the contrast rules of the spec (text and muted text on bg, surface and raised ≥ 4.5; each `pc` colour on surface ≥ 3). That is the one place the palette rules are enforced.
- Alternative: set the variables from a TypeScript table. That puts the values in two languages and needs a script before first paint.

### Applying the theme without a flash
- The choice is a local setting `theme` (default `slate`, validated against the ids). Settings load from SQLite after the first paint, so the id is also mirrored in `localStorage` (`orbit-theme`), and an inline script in `index.html` sets `data-theme` on `<html>` before React starts.
- `applyTheme(id)` sets the attribute and the mirror; `useSettings().save('theme', id)` calls it. The database stays the source of truth: at start, `AppRoot` applies the stored value if it differs from the mirror (for example after a browser data clear).
- The loading screen and `StartScreen` use the same tokens, so they follow the theme from the first paint.

### Colour slots
- A colour is stored as a **slot key**, `'pc0'` … `'pc7'`, and rendered as `var(--pc3)`. A theme switch therefore recolours everything and never rewrites data.
- `src/core/ui/colors.ts` (pure, tested):
  - `SLOTS`, `slotColor(key)`, `isSlot(value)`;
  - `pickSlot(usedSlots)`: the least used slot, the first in palette order on a tie (spec "Colours differ" and "Least used first");
  - `projectColor(project)`: the stored slot, else a slot derived from a hash of the project id (the same on every device);
  - `goalColor(goal, index)`: the stored slot, or a legacy hex value as it is, or the slot for its position.
- `AREA_COLORS` stays hex (areas are small chips with a dot, outside the slot system). `GOAL_COLORS` is replaced by `SLOTS`.
- Alternative: store hex values per theme. That would break "colour follows the theme" and make a synced colour theme-dependent.

### Schema
- `projects.color` is `text`, nullable. Migration `0001` is generated with `npm run db:generate` (an `ALTER TABLE … ADD COLUMN`), and the server's with `npm run db:generate:server`. No data migration: existing rows have `NULL`.
- `SCHEMA_VERSION` becomes 2 automatically (journal length). The tests that name version 1 are updated.
- **Deploy order:** the server must be migrated before devices sync (`npm run server:deploy` runs `server:migrate`). A device already on version 2 against a version 1 server reports "different schema version" and waits, which is the specified behaviour. The README gets one line on this.

### Project colour in data and UI
- `ProjectView` already carries the project row; `createProject` picks the slot with `pickSlot` from the non-deleted projects' colours in the same batch-free read-then-insert (races are harmless: a duplicate colour is allowed).
- `TaskView` and the Home queries need the project's colour next to its title; `TaskRow` gets an optional `projectColor` and a `projectName`, and renders the chip and the rail from them. `Chip` gets a `project` variant (tinted background by `color-mix`, name in text colour, dot in the slot colour).
- Rails and tints are set by one CSS variable on the tile (`style={{ '--pc': slotColor(key) }}`), and the module CSS uses `var(--pc)`, as in the mock-up.

### Restyle: structure
- New small components: `Tile` (the card: radius, border, optional rail colour and header) and `ThemeSwitcher` (swatch buttons with `aria-pressed`). Existing `Section`, `ListRow`, `Chip`, `ProgressBar` and `PageHeader` get the new look in their CSS.
- Per screen the change is mostly CSS Modules and wrapper markup; no behaviour, repository or route changes. The mock-ups are the reference for layout, not for markup.
- `Space Grotesk` is removed from `theme.css` (the font file may stay in `assets/` for now); headings use Inter 600; timers use `font-variant-numeric: tabular-nums`.

## Risks / Trade-offs

- [Colour values in two places: the mock-up and the CSS] → The mock-ups are copied into the change; the contrast test guards the CSS.
- [Schema bump while a sync server is deployed] → Documented in the README and the proposal; sync waits, no data is lost.
- [A restyle touches many files] → Behaviour stays untouched and existing tests must still pass; the visual check is per theme on three screens (task 4.3).
- [Hash-derived colours for older projects can repeat] → Acceptable; the user can change them in the form, and new projects use `pickSlot`.
- [`color-mix()` support] → Chromium and WebKitGTK versions required by Tauri 2 and current browsers support it (already used in the app).
