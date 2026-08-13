import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

export function parsePullArgs(argv: string[]) {
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

export function printPullHelp() {
  process.stdout.write(`data-schema-pull — download spec.json from S3 onto this machine

Usage:
  bun run data-schema-pull [-- --table <name>]

Local dev computer. Writes data-schema/<table>/spec.json from S3
sources/spec.json. Does not import dumps or touch Postgres.

Compares spec.updatedAt (stamped by publish). Missing or older local
spec is overwritten. Same updatedAt is left alone. Newer local: the CLI
asks (TTY) and shows both timestamps. Non-interactive skips that table.

To fill data.* from a published dump: /admin/data-schema Import.
(staging/production). To upload a spec: data-schema-publish.

Source geojson/gpkg is not on S3; data-schema-load reads
data-schema/<table>/<spec.source.file> or --file.

Options:
  --table <name>  One table (default: all tables under data-schema/ on S3)
  -h, --help      This message
`)
}
