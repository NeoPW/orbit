# Proposal

## Why

The branding round is decided: the name stays Orbit and the icon is two crossed, tapered rings that weave over and under each other, on a tile in the colours of the app's own ground. The current icon (a glowing planet with a cyan moon on a starry sky) is described in the `visual-design` spec and used on the desktop, in the browser, in the sidebar and on Android. See docs/SPEC.md §10 "Branding".

## What Changes

- New app icon as a vector master (`assets/icon/orbit.svg`) and the PNG, ICO and ICNS files made from it: the sidebar and browser icon, the desktop icons in `src-tauri/icons/`, the Android launcher icons (legacy, round and adaptive foreground) and the Android status-bar notification icon.
- The loading screen (the browser page and the desktop window) shows the app's dark ground with the new icon, instead of the starry night sky with the planet.
- The desktop window's start colour and the Android launcher background change from the night-sky blue to the app ground.
- A script (`npm run icons`) that draws the master and renders all sizes, so the icon can be changed in one place.
- `docs/SPEC.md` §10: the branding question is closed.

**Out of scope:** the solar-system idea in the Plan tab, a rename, Windows and macOS store assets, and the Android widget.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `visual-design`: "App icon and loading screen" describes the new icon and loading screen.

## Impact

- `assets/icon/`, `src-tauri/icons/`, `src-tauri/gen/android/app/src/main/res/` (launcher mipmaps, colours, notification icon), `src-tauri/tauri.conf.json` (window colour), `index.html`, `src/app/StartScreen.tsx` and its CSS, `scripts/make-icons.mjs`, `package.json`.
- No schema change, no new package; rendering uses the installed Chrome and the Tauri CLI.
