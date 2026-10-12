# Design

## Context

- `flutter build web` produces a static bundle in `build/web`. The app uses hash URLs (go_router without `usePathUrlStrategy`), so the host needs no rewrite rules for reloads.
- The database runs in drift's web worker (`web/drift_worker.js`, `web/sqlite3.wasm`, both same-origin). Drift picks the best storage it can: OPFS needs cross-origin isolation in Chrome. Without it, drift falls back to IndexedDB (`lib/core/db/connection.dart`).
- The only cross-origin resources at runtime are the Supabase API (CORS `fetch`) and, by default, Flutter's CanvasKit from `www.gstatic.com`. Fonts and images are bundled.
- The generated `flutter_service_worker.js` only unregisters itself, so there is no service worker caching to invalidate.
- Sign-in is email and password, so Supabase needs no redirect URLs for the new domain. The publishable key in the bundle is already public in the APK, and RLS protects the data.

## Goals / Non-Goals

**Goals:** one command that builds and publishes the web app from this machine, with the same safety checks as `tool/build_release.sh`.

**Non-Goals:** CI, preview deployments per branch, a custom domain, `--wasm`, offline start.

## Decisions

1. **Cloudflare Pages, direct upload with Wrangler.** The script runs `npx --yes wrangler@<pinned> pages deploy build/web --project-name=orbit-neo --branch=main --commit-dirty=true`.
   - `--branch=main` always deploys to production, even from a feature branch. Without it, Wrangler uses the current git branch and creates a preview URL instead.
   - The Wrangler version is pinned in the script to the version that is current at apply time, so a new Wrangler release can't change the deploy without notice.
   - Running through `npx` keeps Wrangler out of the repo. There is no `package.json`, and Node is already installed.
   - *Alternative:* Pages Git integration or a GitHub Action. Rejected for now. It needs Flutter in CI and `supabase.json` as a secret, and the APK is released by hand too.

2. **Cross-origin isolation through `web/_headers`.** The file sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` for `/*`. Flutter copies everything in `web/` into `build/web`, and Pages applies `_headers` from the upload root.
   - With `require-corp`, the CanvasKit load from gstatic would be blocked. The build uses `--no-web-resources-cdn`, so CanvasKit is served from the site itself. The bundle is a few MB bigger, but it's the same origin and needs no CORP headers.
   - Supabase calls are CORS requests, so COEP allows them.
   - *Alternative:* no headers, staying on IndexedDB. It works, but OPFS is faster and more robust, and the headers are a single file.
   - `flutter run -d chrome` during development sends no such headers and keeps using IndexedDB. That's fine, because the code paths are drift's.

3. **No own cache rules.** Cloudflare Pages serves every file with `Cache-Control: public, max-age=0, must-revalidate` and an ETag. A reload therefore revalidates `index.html`, `flutter_bootstrap.js` and `main.dart.js` and gets the new build. Flutter's `main.dart.js` has no hashed filename, so long-lived caching would be wrong anyway. Tasks verify the headers with `curl -I`.

4. **Script shape mirrors `tool/build_release.sh`.**
   - It uses `set -euo pipefail` and resolves the repo root.
   - It checks `supabase.json` and stops if it is missing. It checks that `npx` exists.
   - It prints the reminder: "If this version changes the database schema, run supabase/schema.sql first (README, Sync)".
   - It builds with `flutter build web --release --dart-define-from-file=supabase.json --no-web-resources-cdn`.
   - It checks that `build/web/_headers` exists, then deploys.
   - It prints the version and build number from `pubspec.yaml` and the URL.
   - It doesn't ask for confirmation. A deploy is cheap to repeat, and a rollback is one click in the Pages dashboard.

5. **Metadata.**
   - `index.html` gets `<title>Orbit</title>`, `apple-mobile-web-app-title` "Orbit" and a real description.
   - `manifest.json` gets `name`/`short_name` "Orbit", the same description and `orientation` `any`. That's for a landscape PC window; Android uses the native app.

No new packages, and no database or schema changes.

## Risks / Trade-offs

- [`orbit-neo.pages.dev` is taken, and Pages assigns a suffixed subdomain] → The project is created in task 2.1 before anything else depends on the URL. If the subdomain differs, update the URL in the spec delta, the script, README and SPEC.md first.
- [COEP blocks a resource and the app fails to load] → Task 3.2 checks `crossOriginIsolated`, the console and a full sync on the live site. Fallback: delete `web/_headers` and redeploy, and drift uses IndexedDB.
- [Deploying a version that needs a newer server schema breaks sync for that browser] → The script prints the reminder, and SPEC §7 already requires running `schema.sql` first. Data stays local, so sync resumes after the schema is run.
- [Anyone can load the app shell] → Accepted (proposal). Data needs the account login, and sign-up is disabled on the server.

## Migration Plan

1. One time: create a free Cloudflare account, run `npx wrangler login`, and run `npx wrangler pages project create orbit-neo --production-branch=main`.
2. Run `tool/deploy_web.sh`, open `https://orbit-neo.pages.dev`, and sign in. The account's data replaces the empty local data.

Rollback: in the Pages dashboard, roll back to the previous deployment, or delete the project. Nothing in the app depends on the site.
