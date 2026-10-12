#!/usr/bin/env bash
# Builds the web app with sync configured and deploys it to Cloudflare Pages
# (https://orbit-neo.pages.dev):
#   tool/deploy_web.sh
# Needs supabase.json and a logged-in Wrangler (npx wrangler login, see
# README "Web hosting"). Always deploys to production, also from a branch.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="orbit-neo"
url="https://$project.pages.dev"
wrangler="wrangler@4.149.0"

[[ $# -eq 0 ]] || { echo "usage: $0" >&2; exit 2; }
[[ -f "$root/supabase.json" ]] || { echo "error: supabase.json not found, see README (Sync)" >&2; exit 1; }
command -v npx >/dev/null || { echo "error: npx not found; install Node.js" >&2; exit 1; }

echo "If this version changes the database schema, run supabase/schema.sql first (README, Sync)."

cd "$root"
# No CanvasKit from Google's CDN: web/_headers enables cross-origin isolation,
# which would block it.
flutter build web --release --dart-define-from-file=supabase.json --no-web-resources-cdn

[[ -f build/web/_headers ]] || { echo "error: build/web/_headers missing (web/_headers)" >&2; exit 1; }

npx --yes "$wrangler" pages deploy build/web \
  --project-name="$project" --branch=main --commit-dirty=true

version="$(awk '$1 == "version:" { print $2; exit }' pubspec.yaml)"
echo "Orbit ${version%+*} (build ${version#*+})"
echo "$url"
