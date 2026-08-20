#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { loadLocalSpec, writeLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  getDataSchemaSpecIfExists,
  listDataSchemaTables,
} from '@/server/dataSchema/dataSchemaS3.server'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { runCli } from '../cli'
import { listLocalTablesWithSpec } from '../localTables'
import { resolveSpecOverwrite } from '../specConflict'
import { parsePullArgs, printPullHelp } from './args'
import { describePullMissingOnS3, formatEmptyS3PullMessage, formatPullOutro } from './status'

export async function runPull(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printPullHelp()
    return
  }

  const options = parsePullArgs(argv)

  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const tables = options.table ? [options.table] : await listDataSchemaTables()
  const localTables = await listLocalTablesWithSpec()

  if (tables.length === 0) {
    p.log.warn(formatEmptyS3PullMessage(localTables))
    return
  }

  p.intro('data-schema-pull')
  p.log.info('Downloads spec.yaml from S3 onto this machine. Does not upload local specs.')
  const rows: { table: string; spec: string }[] = []
  let localKeptMissingS3 = 0

  for (const table of tables) {
    const incoming = await getDataSchemaSpecIfExists(table, options.snapshotId)
    if (!incoming) {
      const hasLocalSpec = (await loadLocalSpec(table)) != null
      if (hasLocalSpec) localKeptMissingS3 += 1
      const missing = describePullMissingOnS3({
        table,
        snapshotId: options.snapshotId,
        hasLocalSpec,
      })
      rows.push({ table, spec: missing.summary })
      p.log.warn(missing.line)
      continue
    }

    const existing = await loadLocalSpec(table)
    const resolved = await resolveSpecOverwrite({
      table,
      direction: 'pull',
      existing,
      incoming,
    })
    if (!resolved.write) {
      const spec = resolved.reason === 'same' ? 'unchanged' : 'kept local'
      rows.push({ table, spec })
      p.log.info(`${table}: ${spec}`)
      continue
    }

    const localPath = await writeLocalSpec(table, incoming)

    rows.push({ table, spec: 'pulled' })
    p.log.success(`${table}: spec → ${localPath}`)
  }

  const localOnly = options.table ? [] : localTables.filter((table) => !tables.includes(table))
  const summary = rows.map((r) => `${r.table.padEnd(32)} ${r.spec}`).join('\n')
  p.note(summary, 'Summary')
  p.outro(
    formatPullOutro({
      pulled: rows.filter((r) => r.spec === 'pulled').length,
      total: tables.length,
      localKeptMissingS3,
      localOnly,
    }),
  )
}

if (import.meta.main) {
  await runCli(runPull)
}
