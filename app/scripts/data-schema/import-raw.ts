import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { parseImportRawArgs, printCommandHelp } from './args'
import { SCHEMA, assertDevelopmentEnvironment, getDatabaseUrl, getRowCount, runPsql } from './db'
import { assertOgrToolsPresent, getSourceLayerInfo, runOgr2ogrImport } from './ogr'
import { geometryTypesMatch } from './ogrHelpers'

export async function runImportRaw(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printCommandHelp('import-raw')
    return
  }

  const options = parseImportRawArgs(argv)
  assertDevelopmentEnvironment()
  await assertOgrToolsPresent()

  const localSpecPath = dataSchemaLocalSpecPath(options.table)
  if (!existsSync(localSpecPath)) {
    throw new Error(`Local spec not found: ${localSpecPath} (run sync or create it first)`)
  }

  const spec = parseDataSchemaSpec(JSON.parse(await readFile(localSpecPath, 'utf8')), options.table)

  const filePath = options.file
    ? resolve(options.file)
    : dataSchemaLocalSourcePath(options.table, spec.source.file)

  if (!existsSync(filePath)) {
    throw new Error(`Source file not found: ${filePath}`)
  }

  p.intro('data-schema import-raw')
  const layerInfo = await getSourceLayerInfo(filePath, spec.import.layer)
  p.log.info(
    `Source: ${layerInfo.featureCount.toLocaleString()} features, geometry=${layerInfo.geometryType}, layer=${layerInfo.layerName}`,
  )

  if (!geometryTypesMatch(layerInfo.geometryType, spec.import.expectedGeometryType)) {
    throw new Error(
      `Geometry type mismatch: source=${layerInfo.geometryType}, expected=${spec.import.expectedGeometryType}`,
    )
  }

  // Fresh DBs after Prisma migrations alone may lack `data`; ogr2ogr -lco SCHEMA=data does not create it.
  await runPsql(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA};`)

  const databaseUrl = getDatabaseUrl()
  const spinner = p.spinner()
  spinner.start(`Importing into ${SCHEMA}.${spec.table}…`)
  await runOgr2ogrImport({ filePath, spec, databaseUrl })
  spinner.stop(`Imported into ${SCHEMA}.${spec.table}.`)

  const dbCount = await getRowCount(spec.table)
  if (dbCount !== layerInfo.featureCount) {
    throw new Error(`Row count mismatch: source=${layerInfo.featureCount}, database=${dbCount}`)
  }
  p.log.success(`Verified row count: ${dbCount.toLocaleString()}`)

  for (const index of spec.indexes) {
    const cols = index.columns.join(', ')
    const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${SCHEMA}.${spec.table} USING ${index.using} (${cols});`
    await runPsql(sql)
    p.log.info(`Index: ${index.name}`)
  }

  p.outro(`Done. ${SCHEMA}.${spec.table}: ${dbCount.toLocaleString()} rows.`)
}
