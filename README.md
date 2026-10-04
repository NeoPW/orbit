# orbit

Personal, local-first app for objectives, key results, projects, tasks, habits, work logs and a weekly review. Flutter, targeting Android and the web.

- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`

## Commands

| What | Command |
|---|---|
| Run on phone | `flutter run` |
| Run in the browser | `flutter run -d chrome` |
| Code generation (drift, riverpod) | `dart run build_runner build --delete-conflicting-outputs` |
| Analyze | `flutter analyze` |
| Test | `flutter test` |
| Update web database assets | `tool/fetch_web_assets.sh` |

Run code generation after changing drift tables or `@riverpod` providers. Generated files (`*.g.dart`, `*.drift.dart`) are committed.

## Database

Data is stored locally with [drift](https://drift.simonbinder.eu/), opened through `drift_flutter`:

- **Android:** native SQLite.
- **Web:** SQLite compiled to WebAssembly, running in a web worker and persisted in browser storage (OPFS or IndexedDB). If the browser offers no persistent storage, the app falls back to an in-memory database and shows a warning banner.

### Web assets

The browser build needs two files in `web/`:

- `web/sqlite3.wasm`: SQLite compiled to WebAssembly, from the [sqlite3.dart releases](https://github.com/simolus3/sqlite3.dart/releases) (`sqlite3-<version>`).
- `web/drift_worker.js`: drift's web worker, from the [drift releases](https://github.com/simolus3/drift/releases) (`drift-<version>`).

Both must match the `sqlite3` and `drift` versions in `pubspec.lock`, and both are committed so a fresh checkout runs in Chrome straight away.

**After upgrading `drift` or `sqlite3`** (any change to their versions in `pubspec.lock`), run:

```bash
tool/fetch_web_assets.sh
```

It reads both versions from `pubspec.lock`, downloads the matching files into `web/` and prints the versions it used. Commit the updated files together with the `pubspec.lock` change.
