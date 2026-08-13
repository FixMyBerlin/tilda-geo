import { mkdir, writeFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
  dataSchemaTableDir,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  createDataSchemaS3Client,
  downloadS3ObjectToFile,
  getS3ObjectJson,
  listDataSchemaTables,
  s3ObjectExists,
} from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSourceFileKey, dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../shared/env'
import { parseSyncArgs, printSyncHelp } from './args'

export async function runSync(argv: string[]) {
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

  p.intro('data-schema sync')
  const rows: { table: string; spec: string; raw: string }[] = []

  for (const table of tables) {
    const specKey = dataSchemaSpecKey(table)
    const exists = await s3ObjectExists(client, bucket, specKey)
    if (!exists) {
      rows.push({ table, spec: 'missing on S3', raw: '—' })
      p.log.warn(`${table}: no ${specKey}`)
      continue
    }

    const parsed = parseDataSchemaSpec(await getS3ObjectJson(client, bucket, specKey), table)

    const localSpecPath = dataSchemaLocalSpecPath(table)
    await mkdir(dataSchemaTableDir(table), { recursive: true })
    await writeFile(localSpecPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

    let rawStatus = 'skipped'
    if (options.withRaw) {
      const sourceKey = dataSchemaSourceFileKey(table, parsed.source.file)
      const rawExists = await s3ObjectExists(client, bucket, sourceKey)
      if (!rawExists) {
        rawStatus = 'not on S3'
      } else {
        const dest = dataSchemaLocalSourcePath(table, parsed.source.file)
        await downloadS3ObjectToFile(client, bucket, sourceKey, dest)
        rawStatus = 'downloaded'
      }
    }

    rows.push({ table, spec: 'synced', raw: rawStatus })
    p.log.success(`${table}: spec → ${localSpecPath}`)
  }

  const summary = rows
    .map((r) => `${r.table.padEnd(32)} spec=${r.spec.padEnd(14)} raw=${r.raw}`)
    .join('\n')
  p.note(summary, 'Summary')
  p.outro(`Synced ${rows.filter((r) => r.spec === 'synced').length}/${tables.length} table(s).`)
}
