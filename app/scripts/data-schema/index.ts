#!/usr/bin/env bun

export function formatRootHelp() {
  return `data-schema

Four scripts (from app/):

  data-schema-verify   Validate local spec.json (no DB, no S3)
  data-schema-sync     Pull specs from S3 into local data-schema/ (any machine)
  data-schema-load     Local dev computer: source file → local data.<table> (ogr2ogr)
  data-schema-publish  Local dev computer: spec.json + pg_dump → S3 latest/

Staging/production get data.* tables via /admin/data-schema Import, not via sync.

Usage:
  bun run data-schema-verify [-- --table <name>]
  bun run data-schema-sync [-- --table <name>]
  bun run data-schema-load -- --table <name> [--file <path>]
  bun run data-schema-publish -- --table <name> [--spec-only] [--mode override|snapshot]

  bun run data-schema-verify -- --help
  bun run data-schema-sync -- --help
  bun run data-schema-load -- --help
  bun run data-schema-publish -- --help
`
}

if (import.meta.main) {
  process.stdout.write(formatRootHelp())
}
