# Instrumentation

The functions in this folder are run on server startup via a **Nitro plugin** so that custom SQL functions are registered before handling requests. They are also called on demand after processing finishes.

- **Startup:** [nitro-sql-registration.plugin.server.ts](./nitro-sql-registration.plugin.server.ts) is registered in [vite.config.ts](../../vite.config.ts) (Nitro `plugins`). On the first request, it runs `registerSQLFunctions()` once; subsequent requests reuse that registration.
- **After processing:** [/api/private/post-processing-hook](/app/src/routes/api/private/post-processing-hook.ts) calls `registerSQLFunctions()` when the processing pipeline has finished.

## `registerSqlFunctions`

Functions that register our custom SQL functions.

They are also being called by the [/api/private/post-processing-hook](/app/src/routes/api/private/post-processing-hook.ts) endpoint which happens after the processing finished.

1. `initExportFunctions(exportApiIdentifier)`
   Create the PostgreSQL functions that are used by the export API in `src/routes/api/export.$regionSlug.$tableName.ts`
2. `initGeneralizationFunctions(InteracitvityConfiguartion)`
   Create the PostgreSQL functions that act as Martin function layers. Their main goal is to reduce tile size, which is archieved by simplifying geometries and leaving out tags that are not used in any style.
