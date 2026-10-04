#!/usr/bin/env bash
# Downloads the web database assets that drift needs in the browser:
#   web/sqlite3.wasm     from simolus3/sqlite3.dart release sqlite3-<version>
#   web/drift_worker.js  from simolus3/drift release drift-<version>
# Versions are read from pubspec.lock so the assets always match the Dart
# packages. Run this after any upgrade that changes drift or sqlite3, then
# commit both files.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
lock="$root/pubspec.lock"
web="$root/web"

locked_version() {
  # Prints the resolved version of package $1 from pubspec.lock.
  awk -v pkg="  $1:" '
    $0 == pkg { found = 1; next }
    found && /^  [^ ]/ { exit }
    found && $1 == "version:" { gsub(/"/, "", $2); print $2; exit }
  ' "$lock"
}

download() {
  # Downloads $1 to $2 atomically, so a failed download keeps the old file.
  local tmp
  tmp="$(mktemp "$2.XXXXXX")"
  if ! curl --fail --silent --show-error --location --output "$tmp" "$1"; then
    rm -f "$tmp"
    echo "error: download failed: $1" >&2
    exit 1
  fi
  chmod 644 "$tmp"
  mv "$tmp" "$2"
}

[[ -f "$lock" ]] || { echo "error: $lock not found; run 'flutter pub get' first" >&2; exit 1; }

sqlite3_version="$(locked_version sqlite3)"
drift_version="$(locked_version drift)"
[[ -n "$sqlite3_version" ]] || { echo "error: sqlite3 not found in pubspec.lock" >&2; exit 1; }
[[ -n "$drift_version" ]] || { echo "error: drift not found in pubspec.lock" >&2; exit 1; }

echo "sqlite3 $sqlite3_version -> web/sqlite3.wasm"
download "https://github.com/simolus3/sqlite3.dart/releases/download/sqlite3-$sqlite3_version/sqlite3.wasm" "$web/sqlite3.wasm"

echo "drift $drift_version -> web/drift_worker.js"
download "https://github.com/simolus3/drift/releases/download/drift-$drift_version/drift_worker.js" "$web/drift_worker.js"

echo "done"
