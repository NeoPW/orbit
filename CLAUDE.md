# Project Tracker

Personal local-first app for goals, projects, tasks, habits, focused work and a weekly review: a Tauri desktop app (React + TypeScript) with a browser build of the same frontend; an Android companion comes later.

## Sources of truth
- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`
- Project conventions: `openspec/config.yaml` (context section)

## Workflow
- All feature work goes through OpenSpec: propose → review → apply → archive.
- Do not implement features that are not part of the active change. If something outside the change seems necessary, say so instead of doing it.
- If a decision changes during implementation, update the change's artifacts first, then the code. If it affects the overall product, flag that `docs/SPEC.md` needs updating.

## Token budget
- Keep OpenSpec changes small (see the rules in `openspec/config.yaml`). When a request or proposal would exceed them, propose splitting it first.
- Keep the `context` in `openspec/config.yaml` short.
- During apply, run only the tests affected by the task (`npx vitest run <paths>`); run `npm run check` (full suite) once, in the final verification task.
- Take screenshots only when a visual check is really needed.
- Suggest switching to Sonnet (`/model`) for mechanical apply work; use Opus for propose and design.

## Commands
- Run the desktop app (dev, "Orbit Dev"): `npm run desktop`
- Run in browser: `npm run dev`
- Build the desktop app (.deb + AppImage): `npm run desktop:build`
- Build the browser version: `npm run build`
- Typecheck + lint + test: `npm run check`
- Some tests: `npx vitest run <paths>`
- Generate a migration after changing src/core/db/schema.ts: npm run db:generate
- Node 24 is pinned in `.node-version` (fnm); Rust comes from `~/.cargo/bin`.

## Conventions
- Feature-first structure under `src/features/`, shared code in `src/core/`, platform adapters in `src/platform/`.
- UI → state → repositories → database. No database calls from components.
- Domain logic as pure TypeScript functions with Vitest tests.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
