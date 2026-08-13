import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

export function parseLoadArgs(argv: string[]) {
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

export function printLoadHelp() {
  process.stdout.write(`data-schema-load — source file → local data.<table>

Usage:
  bun run data-schema-load -- --table <name> [--file <path>]

Laptop only. ogr2ogr into data.<table>, then verify row count and create indexes.
Does not export or upload — run data-schema-publish after you have checked the table.

Options:
  --table <name>  Required table name
  --file <path>   Override source file (default: data-schema/<table>/<spec.source.file>)
  -h, --help      This message

Requires: ogr2ogr, ogrinfo, Docker, ENVIRONMENT=development.
`)
}
