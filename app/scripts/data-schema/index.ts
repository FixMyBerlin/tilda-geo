#!/usr/bin/env bun

import { formatDataSchemaBigPictureHelp } from './help'

export function formatRootHelp() {
  return `data-schema

Commands (from app/):

  data-schema-verify   Validate local spec.json (no DB, no S3)
  data-schema-pull     Download S3 specs into local data-schema/
  data-schema-load     Local dev computer only: source file → local data.<table> (ogr2ogr)
  data-schema-publish  Local dev computer only: spec.json + pg_dump → S3 latest/

Usage:
  bun run data-schema-verify [-- --table <name>]
  bun run data-schema-pull [-- --table <name>]
  bun run data-schema-load -- --table <name> [--file <path>]
  bun run data-schema-publish -- --table <name> [--spec-only] [--mode override|snapshot]

  bun run data-schema-verify -- --help
  bun run data-schema-pull -- --help
  bun run data-schema-load -- --help
  bun run data-schema-publish -- --help

${formatDataSchemaBigPictureHelp()}
`
}

if (import.meta.main) {
  process.stdout.write(formatRootHelp())
}
