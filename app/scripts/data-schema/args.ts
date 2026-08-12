import { parseArgs } from 'node:util'
import { z } from 'zod'
import { dataSchemaIdentifierRegex } from '@/server/dataSchema/dataSchemaSpec.schema'

export const SUBCOMMANDS = ['sync', 'publish-spec', 'import-raw', 'publish'] as const
export type Subcommand = (typeof SUBCOMMANDS)[number]

const tableNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(dataSchemaIdentifierRegex, 'Table name must be lowercase snake_case')

export function parseSyncArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      'with-raw': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema.optional(),
      withRaw: z.boolean(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      withRaw: values['with-raw'],
      help: values.help,
    })
}

export function parsePublishSpecArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      'with-raw': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema,
      withRaw: z.boolean(),
      force: z.boolean(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      withRaw: values['with-raw'],
      force: values.force,
      help: values.help,
    })
}

export function parseImportRawArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      file: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema,
      file: z.string().min(1).optional(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      file: values.file,
      help: values.help,
    })
}

export function parsePublishArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      snapshot: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema,
      snapshot: z.boolean(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      snapshot: values.snapshot,
      help: values.help,
    })
}

export function printRootHelp() {
  process.stdout.write(`data-schema — sync specs, import-raw into local data.*, publish dumps to S3

Usage (from app/):
  bun run data-schema <command> [-- options]

Commands:
  sync           Pull sources/spec.json from S3 into local data-schema/
  publish-spec   Validate local spec and overwrite S3 sources/spec.json
  import-raw     ogr2ogr stage-1 import into local data.<table>
  publish        pg_dump custom format → S3 latest/ (optional --snapshot)

Examples:
  bun run data-schema sync
  bun run data-schema sync -- --table euvm_cutouts_point
  bun run data-schema publish-spec -- --table euvm_cutouts_point
  bun run data-schema import-raw -- --table euvm_cutouts_point
  bun run data-schema publish -- --table euvm_cutouts_point --snapshot

  bun run data-schema <command> -- --help
`)
}

export function printSyncHelp() {
  process.stdout.write(`data-schema sync — pull specs from S3

Usage:
  bun run data-schema sync [-- --table <name>] [-- --with-raw]

Options:
  --table <name>  Sync a single table (default: all tables under data-schema/ on S3)
  --with-raw      Also download sources/<file> when present (not default; can be large)
  -h, --help      This message
`)
}

export function printPublishSpecHelp() {
  process.stdout.write(`data-schema publish-spec — upload local spec to S3 sources/

Usage:
  bun run data-schema publish-spec -- --table <name> [--with-raw] [--force]

Options:
  --table <name>  Required table name
  --with-raw      Also upload local source file to sources/<file>
  --force         Allow uploading source files larger than 100 MB
  -h, --help      This message
`)
}

export function printImportRawHelp() {
  process.stdout.write(`data-schema import-raw — ogr2ogr into local data.<table>

Usage:
  bun run data-schema import-raw -- --table <name> [--file <path>]

Options:
  --table <name>  Required table name
  --file <path>   Override source file (default: data-schema/<table>/<spec.source.file>)
  -h, --help      This message

Requires: ogr2ogr, ogrinfo, Docker, ENVIRONMENT=development.
`)
}

export function printPublishHelp() {
  process.stdout.write(`data-schema publish — pg_dump custom format to S3

Usage:
  bun run data-schema publish -- --table <name> [--snapshot]

Options:
  --table <name>  Required table name
  --snapshot      Also write snapshots/<UTC>/ dump + manifest
  -h, --help      This message

Requires: Docker, ENVIRONMENT=development.
`)
}
