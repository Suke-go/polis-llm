import { sql } from '@vercel/postgres';

/**
 * Re-export Vercel Postgres sql helper.
 * 
 * If you are not using Vercel Postgres, you can replace this
 * implementation with a thin wrapper around `pg` or your preferred
 * PostgreSQL client while keeping the same `sql` interface.
 */
export { sql };

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };


