#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import { getS3ObjectJsonFirst, listDataSchemaTables } from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSpecReadKeys } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { runCli } from '../cli'
import { resolveSpecOverwrite } from '../specConflict'
import { parsePullArgs, printPullHelp } from './args'

export async function runPull(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printPullHelp()
    return
  }

  const options = parsePullArgs(argv)

  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const tables = options.table ? [options.table] : await listDataSchemaTables()

  if (tables.length === 0) {
    p.log.warn('No tables found under data-schema/ on S3.')
    return
  }

  p.intro('data-schema-pull')
  const rows: { table: string; spec: string }[] = []

  for (const table of tables) {
    const specHit = await getS3ObjectJsonFirst(dataSchemaSpecReadKeys(table))
    if (!specHit) {
      rows.push({ table, spec: 'missing on S3' })
      p.log.warn(`${table}: no spec.json`)
      continue
    }

    const incoming = parseDataSchemaSpec(specHit.json, table)
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

    const localPath = dataSchemaLocalSpecPath(table)
    await Bun.write(localPath, JSON.stringify(incoming, null, 2))

    rows.push({ table, spec: 'pulled' })
    p.log.success(`${table}: spec → ${localPath}`)
  }

  const summary = rows.map((r) => `${r.table.padEnd(32)} spec=${r.spec}`).join('\n')
  p.note(summary, 'Summary')
  p.outro(`Pulled ${rows.filter((r) => r.spec === 'pulled').length}/${tables.length} table(s).`)
}

if (import.meta.main) {
  await runCli(runPull)
}
