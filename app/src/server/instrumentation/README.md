# Instrumentation

Registers custom PostgreSQL functions used by the app and Martin tile layers.

## When it runs

- **Startup:** [nitro-sql-registration.plugin.server.ts](./nitro-sql-registration.plugin.server.ts) (Nitro plugin in [vite.config.ts](../../vite.config.ts)) calls `registerSQLFunctions()` on the first request.
- **After processing:** [/api/private/post-processing-hook](/app/src/routes/api/private/post-processing-hook.ts) calls `registerSQLFunctions()` when the processing pipeline reaches Finishing up (before tiles restart). In dev, processing cannot reach the app — trigger the hook manually or rely on startup registration.

## What `registerSQLFunctions` does

1. `initExportFunctions(exportApiIdentifier)` — functions for the export API (`src/routes/api/export.$regionSlug.$tableName.ts`)
2. `initGeneralizationFunctions(InteracitvityConfiguartion)` — Martin function layers that simplify geometries and drop unused tags to reduce tile size

## Related: processing afterthoughts

Other deferred post-processing work does **not** go through this folder or the hook. After `Processing: Finished`, the processing container runs [afterthoughts](../../../processing/steps/afterthoughts.ts) directly:

- **Statistics** — populates `public.aggregated_lengths` (read by `/api/stats`)
- **Sidepath export** — writes `is_sidepath_estimation.csv` for the next run

That runs in the processing container in dev and prod; no app HTTP call required.
