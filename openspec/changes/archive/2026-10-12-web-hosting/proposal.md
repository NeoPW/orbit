# Proposal

## Why

The web version only runs from a local `flutter run -d chrome`. It is meant for planning, logging and reviews on the PC, and syncs with the phone (docs/SPEC.md §2, §7). Now that the phone has a real release, the web version needs a fixed address that works from any computer.

## What Changes

- The web app is hosted as a static site on Cloudflare Pages at `https://orbit-neo.pages.dev`. The URL is public. The site contains no user data: data stays in each browser and behind the Supabase login. Sign-up is already disabled in Supabase.
- A script `tool/deploy_web.sh` builds the web app with the sync configuration (`supabase.json`, §7) and uploads it to Cloudflare Pages with Wrangler, Cloudflare's CLI. It runs through `npx` at a pinned version, so there is no new project dependency. The script reminds you to run `supabase/schema.sql` first when a version changes the schema, then prints the version and the URL.
- The site sends cross-origin isolation headers (`web/_headers`), so the browser database can use OPFS instead of IndexedDB. For this, the build stops loading Flutter's CanvasKit renderer from Google's CDN.
- The page's public metadata is corrected: the title and app name are "Orbit", the description matches the app (not "A new Flutter project." or "Objectives, key results…"), and the installed web app is no longer locked to portrait.
- The README documents the one-time Cloudflare setup (`wrangler login`, creating the Pages project) and deploying. The deploy command is added to the commands tables in README and CLAUDE.md.

Out of scope:
- A custom domain, Cloudflare Access or any other gate in front of the site.
- CI or automatic deploys on push.
- The WebAssembly build of Flutter (`--wasm`).
- Offline start of the web app (a caching service worker).
- Showing the app version in Settings.

## Capabilities

### New Capabilities
- `web-hosting`: how the web app is published and identified: the public address, deploying with the sync configuration, updates reaching open browsers, and the site's name and install metadata.

### Modified Capabilities
<!-- none: behavior inside the app is unchanged -->

## Impact

- `tool/deploy_web.sh` (new), `web/_headers` (new), `web/index.html`, `web/manifest.json`, `README.md`, `CLAUDE.md` (commands).
- `docs/SPEC.md` §2 already has the "Web hosting" line (added during exploration).
- No Dart code, database or `supabase/schema.sql` changes, and no new packages. Wrangler runs through `npx` and needs Node, which is already installed.
- One-time manual steps: a Cloudflare account, `npx wrangler login`, and creating the `orbit-neo` Pages project.
- Browser data on `localhost` during development is separate from the hosted site. The hosted site starts empty and gets its data by signing in and syncing.
