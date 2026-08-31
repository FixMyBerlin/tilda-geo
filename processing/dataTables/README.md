# About

This folder creates the Postgres `data` schema (`CREATE SCHEMA IF NOT EXISTS data`). Processing SQL reads `data.*` from there.

[`dataTables.ts`](dataTables.ts) also runs at processing initialize (`initializeCustomFunctionsDataTables`). Put custom SQL functions here when processing needs them in the database. Nothing is registered there yet.

The `data.*` tables themselves are not owned here. Specs, dumps, and how to load them are the [data-schema](../../data-schema/README.md) pipeline (`add-db-data-table` skill). Per-table docs live in each `spec.yaml` (`source.documentation`, `consumedBy`) and on `/admin/data-schema`. Map GeoJSON/tiles are static datasets, not this schema.
