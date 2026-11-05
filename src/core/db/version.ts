import journal from '../../../drizzle/meta/_journal.json';

/** The schema version: the number of migrations (the `PRAGMA user_version` of a fully migrated database). */
export const SCHEMA_VERSION = journal.entries.length;
