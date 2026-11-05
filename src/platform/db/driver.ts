export type QueryMethod = 'run' | 'all' | 'values' | 'get';

export interface SqlQuery {
  sql: string;
  params: unknown[];
  method: QueryMethod;
}

/** Rows as arrays of column values, in select order. `run` returns no rows; `get` at most one. */
export interface SqlResult {
  rows: unknown[][];
}

/** The one thing each platform implements; Drizzle's sqlite-proxy runs on top of it. */
export interface SqlDriver {
  query(sql: string, params: unknown[], method: QueryMethod): Promise<SqlResult>;
  /** Runs all queries in ONE transaction; the first error rolls everything back and rejects. */
  batch(queries: SqlQuery[]): Promise<SqlResult[]>;
  close(): Promise<void>;
}
