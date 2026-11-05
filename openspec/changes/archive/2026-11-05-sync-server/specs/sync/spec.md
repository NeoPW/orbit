# Spec Delta

## REMOVED Requirements

### Requirement: Server tables per user
**Reason**: The new server holds the data of one user and lets devices in by device token, not by user accounts with per-user rows (`docs/SPEC.md` §7). Its tables are specified in `sync-server` ("Server tables", "Device tokens").
**Migration**: None. The old Supabase project is not used by the rebuilt app; its data is not moved.

### Requirement: Server migration
**Reason**: It moved objectives and key results to goals and measures on the old Supabase server. The new server starts empty with the current schema.
**Migration**: None. Later server schema changes are versioned D1 migrations (see `sync-server`, "Same schema version only").
