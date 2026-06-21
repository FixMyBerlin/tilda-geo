import postgres from 'postgres'

/**
 * Shared PostgreSQL client — the drop-in replacement for Bun's built-in `import { sql } from 'bun'`.
 *
 * Bun's `sql` is a re-implementation of {@link https://github.com/porsager/postgres postgres.js},
 * so the query surface we rely on is identical: tagged-template queries, the `sql(object)` helper
 * for dynamic `INSERT`/`UPDATE`, `sql.unsafe(...)` for dynamic SQL, and `.values()`.
 *
 * Connection discovery mirrors Bun's default `sql`: a `DATABASE_URL` / `POSTGRES_URL` connection
 * string when present, otherwise the standard libpq `PG*` environment variables (`PGHOST`,
 * `PGUSER`, `PGPASSWORD`, `PGDATABASE`, …) which the processing container sets.
 */
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

export const sql = connectionString ? postgres(connectionString) : postgres()
