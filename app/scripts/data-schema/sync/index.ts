#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath } from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  createDataSchemaS3Client,
  getS3ObjectJson,
  listDataSchemaTables,
  s3ObjectExists,
} from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { runCli } from '../cli'
import { parseSyncArgs, printSyncHelp } from './args'

async function runSync(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printSyncHelp()
    return
  }

  const options = parseSyncArgs(argv)

  getValidatedEnv(staticDatasetsS3CredentialsSchema)
  const { client, bucket } = createDataSchemaS3Client()

  const tables = options.table ? [options.table] : await listDataSchemaTables(client, bucket)

  if (tables.length === 0) {
    p.log.warn('No tables found under data-schema/ on S3.')
    return
  }

  p.intro('data-schema-sync')
  const rows: { table: string; spec: string }[] = []

  for (const table of tables) {
    const specKey = dataSchemaSpecKey(table)
    const exists = await s3ObjectExists(client, bucket, specKey)
    if (!exists) {
      rows.push({ table, spec: 'missing on S3' })
      p.log.warn(`${table}: no ${specKey}`)
      continue
    }

    const parsed = parseDataSchemaSpec(await getS3ObjectJson(client, bucket, specKey), table)

    const localSpecPath = dataSchemaLocalSpecPath(table)
    await Bun.write(localSpecPath, JSON.stringify(parsed, null, 2))

    rows.push({ table, spec: 'synced' })
    p.log.success(`${table}: spec → ${localSpecPath}`)
  }

  const summary = rows.map((r) => `${r.table.padEnd(32)} spec=${r.spec}`).join('\n')
  p.note(summary, 'Summary')
  p.outro(`Synced ${rows.filter((r) => r.spec === 'synced').length}/${tables.length} table(s).`)
}

if (import.meta.main) {
  await runCli(runSync)
}
