#!/usr/bin/env bun

export function formatRootHelp() {
  return `data-schema

Four scripts (from app/):

  data-schema-verify   Validate local spec.json (no DB, no S3)
  data-schema-pull     Download S3 specs into local data-schema/
  data-schema-load     Local dev computer: source file → local data.<table> (ogr2ogr)
  data-schema-publish  Local dev computer: spec.json + pg_dump → S3 latest/

Restore dumps into data.* via /admin/data-schema Import (every environment).

Usage:
  bun run data-schema-verify [-- --table <name>]
  bun run data-schema-pull [-- --table <name>]
  bun run data-schema-load -- --table <name> [--file <path>]
  bun run data-schema-publish -- --table <name> [--spec-only] [--mode override|snapshot]

  bun run data-schema-verify -- --help
  bun run data-schema-pull -- --help
  bun run data-schema-load -- --help
  bun run data-schema-publish -- --help
`
}

if (import.meta.main) {
  process.stdout.write(formatRootHelp())
}
