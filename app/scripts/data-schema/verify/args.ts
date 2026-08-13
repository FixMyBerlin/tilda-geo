import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

export function parseVerifyArgs(argv: string[]) {
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

export function printVerifyHelp() {
  process.stdout.write(`data-schema-verify — validate local spec.json against the TypeScript schema

Usage:
  bun run data-schema-verify [-- --table <name>]

Parses data-schema/<table>/spec.json with parseDataSchemaSpec. Does not load
Postgres or talk to S3.

Options:
  --table <name>  One table (default: every local data-schema/<table>/spec.json)
  -h, --help      This message
`)
}
