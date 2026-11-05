# Spec Delta

## REMOVED Requirements

### Requirement: Public web address
**Reason**: The Flutter web build on Cloudflare Pages is replaced by the rebuild.
**Migration**: The browser build is published again by the Cloudflare Worker in change `sync-server`.

### Requirement: No user data on the site
**Reason**: The Flutter web build and Supabase sign-in are removed in the rebuild.
**Migration**: Redefined with the sync server's token-based access in change `sync-server`.

### Requirement: Persistent browser storage on the hosted site
**Reason**: The Flutter web database is removed in the rebuild.
**Migration**: Browser storage (SQLite WASM in OPFS) is redefined in change `local-database`.

### Requirement: Deploy with sync configured
**Reason**: The Flutter deploy script and Supabase configuration are removed in the rebuild.
**Migration**: A new deploy for the Worker and the browser build comes with change `sync-server`.

### Requirement: Updates reach open browsers
**Reason**: The Flutter web build is removed in the rebuild.
**Migration**: Redefined for the new browser build in change `sync-server`.

### Requirement: Site name and install metadata
**Reason**: The Flutter web build is removed in the rebuild.
**Migration**: The browser build keeps the name "Orbit" and its icon (see `app-platforms`); install metadata returns with hosting in change `sync-server`.
