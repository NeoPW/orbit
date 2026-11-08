# Proposal

## Why

The solar system (goals as planets, projects as moons, loose projects as asteroids) was a feature of the previous app. It was never rebuilt: there is no code for it in `src/`, and SPEC §6 says Plan has no planets or other space visuals. The open question in SPEC §10 about where it would appear was closed by dropping the idea. The capability spec in `openspec/specs/solar-system/` still describes it as implemented behavior, which is wrong.

## What Changes

- Remove the `solar-system` capability: all seven requirements.
- No code changes; nothing in the app implements it.
- `docs/SPEC.md` §10 no longer lists the solar system (already done); no other SPEC section mentions it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-system`: all requirements removed, so the capability is gone after archive.

## Impact

- `openspec/specs/solar-system/` is deleted when the change is archived and synced.
- Out of scope: any other spec, app code, or the app icon (the planet icon was already replaced by `app-icon`).
