-- Used by scripts/db-pull/restore-local.ts (via Dockerized psql) before loading a schema dump.
-- Drops only the selected schema (`--set=schema=<name>`) to ensure a clean restore without touching other schemas or the database.
DROP SCHEMA IF EXISTS:"schema" CASCADE;
