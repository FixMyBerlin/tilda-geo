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
      snapshot: { type: 'boolean', default: false },
      'spec-only': { type: 'boolean', default: false },
      'with-source-file': { type: 'boolean', default: false },
      'with-raw': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  const specOnly = values['spec-only'] === true
  const snapshot = values.snapshot === true
  const mode = resolvePublishModeArg(values.mode, snapshot)
  if (specOnly && mode === 'snapshot') {
    throw new Error('--spec-only does not write a dump; omit --mode / --snapshot')
  }
  return z
    .object({
      table: tableNameSchema,
      mode: z.enum(PUBLISH_MODES).optional(),
      specOnly: z.boolean(),
      withSourceFile: z.boolean(),
      force: z.boolean(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      mode,
      specOnly,
      withSourceFile: values['with-source-file'] === true || values['with-raw'] === true,
      force: values.force === true,
      help: values.help,
    })
}

function resolvePublishModeArg(mode: string | undefined, snapshot: boolean) {
  if (mode !== undefined && snapshot && mode !== 'snapshot') {
    throw new Error('--snapshot conflicts with --mode override')
  }
  if (mode !== undefined) return mode
  return snapshot ? 'snapshot' : undefined
}

export function printPublishHelp() {
  process.stdout.write(`data-schema-publish — upload spec + dump to S3

Usage:
  bun run data-schema-publish -- --table <name> [--spec-only] [--mode override|snapshot]

Local dev computer only. Always uploads local spec.json when present (tiny). Then replaces
latest/ with a new dump, unless --spec-only. --mode snapshot first copies the current
latest/ to snapshots/<when that version was published>/, then writes the new dump as latest/.

Source geojson/gpkg stays off S3 unless --with-source-file (can be large).

When --mode is omitted and latest/ is at least 1 day old, the CLI asks
(TTY) whether to archive that latest first. Non-interactive stale publishes
override and warn; pass --mode to skip.

Options:
  --table <name>          Required table name
  --spec-only             Skip pg_dump; upload spec.json only
  --with-source-file      Also upload the local source file to sources/<file>
  --with-raw              Same as --with-source-file
  --force                 Allow uploading source files larger than 100 MB
  --mode override         Replace latest/ only
  --mode snapshot         Archive current latest/, then replace latest/
  --snapshot              Same as --mode snapshot
  -h, --help              This message

Dump path requires: Docker, ENVIRONMENT=development.
`)
}
