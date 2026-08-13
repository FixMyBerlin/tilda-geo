import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'
import { PUBLISH_MODES } from './publishMode'

export function parsePublishArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      mode: { type: 'string' },
      'spec-only': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  const specOnly = values['spec-only'] === true
  if (specOnly && values.mode) {
    throw new Error('--spec-only does not write a dump; omit --mode')
  }
  return z
    .object({
      table: tableNameSchema,
      mode: z.enum(PUBLISH_MODES).optional(),
      specOnly: z.boolean(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      mode: values.mode,
      specOnly,
      help: values.help,
    })
}

export function printPublishHelp() {
  process.stdout.write(`data-schema-publish — upload spec + dump to S3

Usage:
  bun run data-schema-publish -- --table <name> [--spec-only] [--mode override|snapshot]

Local dev computer only. Requires local spec.json. Compares spec.updatedAt
with S3, then stamps a new updatedAt on the local file and uploads that
same file. If S3 is newer, the CLI asks (TTY) and shows both timestamps.
Non-interactive publish throws instead of clobbering a newer S3 spec.

Then replaces latest/ with a new dump, unless --spec-only. --mode snapshot first
copies the current latest/ to snapshots/<when that version was published>/, then
writes the new dump as latest/.

When --mode is omitted and latest/ is at least 1 day old, the CLI asks
(TTY) whether to archive that latest first. Non-interactive stale publishes
override and warn; pass --mode to skip.

Options:
  --table <name>          Required table name
  --spec-only             Spec.json only, no dump. For provider/documentation/consumedBy
                          or a new spec before first load — not column/geometry changes
  --mode override         Replace latest/ only
  --mode snapshot         Archive current latest/, then replace latest/
  -h, --help              This message

Dump path requires: Docker, ENVIRONMENT=development.
`)
}
