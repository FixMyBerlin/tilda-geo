import { parseArgs } from 'node:util'
import { z } from 'zod'
import { dataSchemaSnapshotIdRegex } from '@/server/dataSchema/dataSchemaS3Keys'
import { formatDataSchemaDocsHelp } from '../help'
import { tableNameSchema } from '../tableName'

export function parsePullArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      snapshot: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  if (values.snapshot && !values.table) {
    throw new Error('--snapshot requires --table')
  }
  return z
    .object({
      table: tableNameSchema.optional(),
      snapshotId: z.string().regex(dataSchemaSnapshotIdRegex).optional(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      snapshotId: values.snapshot,
      help: values.help,
    })
}

export function printPullHelp() {
  process.stdout.write(`data-schema-pull — download spec.yaml from S3 onto this machine

Usage:
  bun run data-schema-pull [-- --table <name>] [--snapshot <id>]

Local dev computer only. Downloads S3 spec.yaml onto data-schema/<table>/spec.yaml
(current, or a snapshot if --snapshot is set). Does not upload local specs
(that is data-schema-publish), import dumps, or touch Postgres.

Missing local spec is written. Identical spec is left alone. Different local:
the CLI asks (TTY). Non-interactive skips that table.

Source geojson/gpkg is not on S3; data-schema-load reads a .geojson/.gpkg in
data-schema/<table>/, or --file if the source lives elsewhere.

Options:
  --table <name>     One table (default: all tables under data-schema/ on S3)
  --snapshot <id>    Restore spec.yaml from snapshots/<id>/ (requires --table)
  -h, --help         This message

${formatDataSchemaDocsHelp('new-or-updated-data')}
`)
}
