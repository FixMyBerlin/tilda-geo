import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

export function parseSyncArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema.optional(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      help: values.help,
    })
}

export function printSyncHelp() {
  process.stdout.write(`data-schema-sync — pull specs from S3 into local data-schema/

Usage:
  bun run data-schema-sync [-- --table <name>]

Pulls sources/spec.json for one table or all tables. Source geojson/gpkg is not
on S3 — load with a local file (data-schema/<table>/<spec.source.file> or --file).

This is a spec mirror, not how staging/production load data.* — that is
/admin/data-schema Import of the published dump.

Options:
  --table <name>  Sync a single table (default: all tables under data-schema/ on S3)
  -h, --help      This message
`)
}
