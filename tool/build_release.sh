#!/usr/bin/env bash
# Builds the signed release APK for Android, with sync configured:
#   tool/build_release.sh            build and check the APK
#   tool/build_release.sh --install  also install it over USB (adb install -r)
# Needs android/key.properties (release key, see README) and supabase.json.
# Bump the build number in pubspec.yaml (version: x.y.z+N) before every
# release; Android refuses to install a lower build number over a higher one.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
apk="$root/build/app/outputs/flutter-apk/app-release.apk"
sdk="${ANDROID_HOME:-$HOME/Android/Sdk}"

install=false
case "${1:-}" in
  "") ;;
  --install) install=true ;;
  *) echo "usage: $0 [--install]" >&2; exit 2 ;;
esac

[[ -f "$root/android/key.properties" ]] || { echo "error: android/key.properties not found, see README" >&2; exit 1; }
[[ -f "$root/supabase.json" ]] || { echo "error: supabase.json not found, see README (Sync)" >&2; exit 1; }

build_tools="$(ls -d "$sdk"/build-tools/*/ 2>/dev/null | sort -V | tail -n 1)"
apksigner="${build_tools}apksigner"
[[ -n "$build_tools" && -x "$apksigner" ]] || { echo "error: apksigner not found under $sdk/build-tools; set ANDROID_HOME" >&2; exit 1; }

cd "$root"
flutter build apk --release --dart-define-from-file=supabase.json

certs="$("$apksigner" verify --print-certs "$apk")"
if grep -q "CN=Android Debug" <<<"$certs"; then
  echo "error: $apk is signed with the Android debug key" >&2
  exit 1
fi

version="$(awk '$1 == "version:" { print $2; exit }' pubspec.yaml)"
echo "Orbit ${version%+*} (build ${version#*+})"
grep "certificate DN" <<<"$certs"
echo "$apk"

if $install; then
  adb="$sdk/platform-tools/adb"
  [[ -x "$adb" ]] || { echo "error: adb not found under $sdk/platform-tools" >&2; exit 1; }
  "$adb" install -r "$apk"
fi
