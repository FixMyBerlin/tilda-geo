import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

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

export function printSyncHelp() {
  process.stdout.write(`data-schema-sync — pull specs from S3 into local data-schema/

Usage:
  bun run data-schema-sync [-- --table <name>] [-- --with-raw]

Pulls sources/spec.json for one table or all tables. Optional --with-raw also
downloads the source geojson/gpkg when present (can be large).

This is a spec mirror, not how staging/production load data.* — that is
/admin/data-schema Import of the published dump.

Options:
  --table <name>  Sync a single table (default: all tables under data-schema/ on S3)
  --with-raw      Also download sources/<file> when present (not default; can be large)
  -h, --help      This message
`)
}
