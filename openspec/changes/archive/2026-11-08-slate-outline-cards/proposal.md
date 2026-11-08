# Proposal

## Why

The cards in the default theme (Slate) look muddy: they sit one navy step above the ground and the project colours are soft pastels, so cards neither separate cleanly nor carry their project colour well. In the colour round ("Orbit Card Colours", round 2) the user picked "Outline + vivid + tinted" (docs/SPEC.md §6.7).

## What Changes

- **Outline cards in Slate:** tiles take the colour of the ground and are drawn by their 1 px outline; inner surfaces (fields, raised rows, project boxes) are one step lighter than before. The outline is a little lighter, so cards stay clear.
- **Vivid project colours in Slate:** the eight project colours become more saturated: orange, blue, green, purple, pink, teal, lime and sand.
- **Clear project outlines on To do rows:** a To do row's outline is drawn at 70 % of its project's colour instead of 45 % (all themes).
- **Unchanged:**
  - Tinted project headers (14 %), the rails, layout and sizes.
  - The other four themes, apart from the stronger To do outline.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `visual-design`: adds "Slate card style".

## Impact

- **Code:** `src/core/ui/theme.css` (Slate tokens) and `src/features/tasks/ui/TaskRow.module.css` (outline strength).
- **Data:** none.
- **Docs:** `docs/SPEC.md` §6.7.

## Out of scope

- A light theme, the other themes' cards, the native look and the branding (name and icon are still open).
