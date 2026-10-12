# Tasks

## 1. Site files

- [x] 1.1 Add `web/_headers`, which sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` for `/*`. Verify: after `flutter build web`, `build/web/_headers` exists with that content.
- [x] 1.2 In `web/index.html`, set the title and `apple-mobile-web-app-title` to "Orbit" and give the description meta tag a real description. In `web/manifest.json`, set `name`/`short_name` to "Orbit", use the same description and set `orientation` to `any`. Verify: `python3 -m json.tool web/manifest.json` succeeds, and `flutter run -d chrome` shows the tab title "Orbit".

## 2. Cloudflare setup and deploy script

- [x] 2.1 (User, manual) Create a free Cloudflare account, run `npx wrangler login`, and run `npx wrangler pages project create orbit-neo --production-branch=main`. Verify: `npx wrangler pages project list` shows `orbit-neo` with the domain `orbit-neo.pages.dev`. If the domain differs, update the spec delta, design and `docs/SPEC.md` before continuing.
- [x] 2.2 Add `tool/deploy_web.sh` (executable), shaped like `tool/build_release.sh`. It:
  - checks `supabase.json` and `npx`;
  - prints the schema reminder;
  - runs `flutter build web --release --dart-define-from-file=supabase.json --no-web-resources-cdn`;
  - checks `build/web/_headers`;
  - deploys with `npx --yes wrangler@<current version, pinned> pages deploy build/web --project-name=orbit-neo --branch=main --commit-dirty=true`;
  - prints the version, build number and `https://orbit-neo.pages.dev`.

  Verify: with `supabase.json` temporarily renamed, the script stops with a message before building. With it present, the script deploys and prints the version and URL.
- [x] 2.3 Document in `README.md` (new section "Web hosting"): the one-time Cloudflare setup from 2.1, `tool/deploy_web.sh`, running `supabase/schema.sql` first when the schema changes, rolling back in the Pages dashboard, and the fact that the hosted site has its own browser data (separate from `localhost`). Add the deploy command to the commands tables in `README.md` and `CLAUDE.md`. Verify: the README commands match the script.

## 3. Verification

- [x] 3.1 Run `flutter analyze` (no warnings) and the full `flutter test -r failures-only` once. Neither should change, since no Dart code changes.
- [x] 3.2 Check the live site:
  - `curl -sI https://orbit-neo.pages.dev/` shows the COOP and COEP headers and `max-age=0, must-revalidate`.
  - `curl -sI https://orbit-neo.pages.dev/main.dart.js` shows `must-revalidate`.
  - In Chrome, `crossOriginIsolated` is `true` and the console has no blocked-resource errors.
- [x] 3.3 On the PC in Chrome, open `https://orbit-neo.pages.dev`. Verify: there's no sign-up option. Signing in brings in the phone's data, and a change syncs to the phone and back. Reloading on Plan stays on Plan. Closing and reopening the tab keeps data and sign-in, with no storage warning. Installing the site as an app gives a resizable "Orbit" window with the Orbit icon.
- [x] 3.4 Bump the build number, deploy again, and reload the open tab. Verify: the new version runs (the script printed the new version, and the reloaded page loads the new `main.dart.js`), and the data and sign-in remain.
- [x] 3.5 Run `flutter run -d chrome --dart-define-from-file=supabase.json` and `flutter run` on the phone. Verify: both start and sync as before.
