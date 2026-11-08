# Tasks

## 1. Remove the capability

- [x] 1.1 Check that nothing references it: `grep -rniE "solar|asteroid" src docs openspec/specs --include=* -l` lists only `openspec/specs/solar-system/spec.md`. Fix `docs/SPEC.md` if it lists anything else.
- [x] 1.2 Run `openspec validate remove-solar-system`; it passes.
- [x] 1.3 Archive the change with its spec sync (`/opsx:archive`); `openspec/specs/solar-system/` is gone and `openspec list --specs` no longer shows it.
