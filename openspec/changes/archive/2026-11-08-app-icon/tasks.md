# Tasks

## 1. Master and generator

- [x] 1.1 Add `scripts/make-icons.mjs` and `npm run icons`: draws the master `assets/icon/orbit.svg` (App ground palette, weave with shadow, rotated -10°, 110 % thickness) and renders `assets/icon/orbit.png` (512), the desktop icons in `src-tauri/icons/` (through `tauri icon`) and the Android launcher mipmaps in all densities.
  - Verify: `npm run icons` runs clean; the SVG and the 512 px PNG look right when opened; the PNG has transparent corners.

## 2. Use it everywhere

- [x] 2.1 Android: set `ic_launcher_background` to the app ground and replace `drawable/ic_notification.xml` with a single-colour crossed-rings vector.
  - Verify: the vector has two crossing ellipses; the colour file holds the new colour.
- [x] 2.2 Desktop window start colour in `src-tauri/tauri.conf.json` and the loading screens in `index.html` and `src/app/StartScreen.module.css`: the app ground with the icon, no night sky.
  - Verify: `npm run dev` shows the new boot screen and sidebar icon in the browser (screenshot).

## 3. Docs and verification

- [x] 3.1 Update `docs/SPEC.md` §10: close the branding question (name Orbit, icon chosen).
- [x] 3.2 Run `npm run check`.
- [x] 3.3 Build or run the desktop app and confirm the window icon, tray icon and sidebar; check the Android icons in the generated files.
