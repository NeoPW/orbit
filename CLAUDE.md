# Project Tracker

Personal local-first Flutter app (Android + web) for objectives, key results, projects, tasks, habits, work logs and a weekly review.

## Sources of truth
- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`
- Project conventions: `openspec/config.yaml` (context section)

## Workflow
- All feature work goes through OpenSpec: propose → review → apply → archive.
- Do not implement features that are not part of the active change. If something outside the change seems necessary, say so instead of doing it.
- If a decision changes during implementation, update the change's artifacts first, then the code. If it affects the overall product, flag that `docs/SPEC.md` needs updating.

## Commands
- Run on phone: `flutter run`
- Run in browser: `flutter run -d chrome`
- Analyze: `flutter analyze`
- Test: `flutter test`
- Code generation (drift, riverpod): `dart run build_runner build --delete-conflicting-outputs`

## Conventions
- Feature-first structure under `lib/features/`, shared code in `lib/core/`.
- UI → Riverpod providers → repositories → drift. No drift calls from widgets.
- Domain logic as pure Dart functions with unit tests.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
