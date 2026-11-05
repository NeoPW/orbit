/** A row as stored on the device: database column names, stored values. */
export type WireRow = Record<string, string | number | boolean | null>;
export type RowsByTable = Record<string, WireRow[]>;

/** Why a sync failed, as shown to the user. */
export type FailureReason = 'offline' | 'token' | 'version' | 'server';
