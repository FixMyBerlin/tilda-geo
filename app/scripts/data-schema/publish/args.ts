import { parseArgs } from 'node:util'
import { z } from 'zod'
import { formatDataSchemaDocsHelp } from '../help'
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

Local dev computer only. Requires local spec.json. If the S3 spec differs,
the CLI asks (TTY). Non-interactive publish throws instead of clobbering a
different S3 spec. Matching specs are left as-is; the dump still publishes.

Then uploads data.dump (pg_dump custom + zstd) and data.manifest.json, unless --spec-only.
--mode snapshot first copies spec.json, data.dump, and data.manifest.json to
snapshots/<when that version was published>/, then overwrites the current files.

When --mode is omitted and the current dump is at least 1 day old, the CLI asks
(TTY) whether to archive that version first. Non-interactive stale publishes
override and warn; pass --mode to skip.

Options:
  --table <name>          Required table name
  --spec-only             Spec.json only, no dump. For provider/documentation/consumedBy
                          or a new spec before first load — not column/geometry changes
  --mode override         Replace current data.dump + data.manifest.json
  --mode snapshot         Archive current spec + dump + manifest, then replace them
  -h, --help              This message

Dump path requires: Docker, ENVIRONMENT=development.

${formatDataSchemaDocsHelp('new-table')}
`)
}
