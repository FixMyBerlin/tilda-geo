#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import { runCli } from '../cli'
import { SCHEMA, assertDevelopmentEnvironment, getRowCount, runPsql } from '../db'
import { resolveRequiredTable } from '../localTables'
import { parseLoadArgs, printLoadHelp } from './args'
import { assertGdalPresent, getSourceLayerInfo, runOgr2ogrImport } from './ogr'
import { geometryTypesMatch } from './ogrHelpers'
import { resolveLoadSourcePath } from './sourceFile'

async function runLoad(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printLoadHelp()
    return
  }

  const options = parseLoadArgs(argv)
  assertDevelopmentEnvironment()
  await assertGdalPresent()

  p.intro('data-schema-load')
  const table = await resolveRequiredTable(options.table, 'load')
  const spec = await loadLocalSpec(table)
  if (!spec) {
    throw new Error(
      `Local spec not found: ${dataSchemaLocalSpecPath(table)} (run data-schema-pull or create it first)`,
    )
  }

  const filePath = await resolveLoadSourcePath({
    table,
    specFile: spec.source.file,
    explicitFile: options.file,
  })
  if (!(await Bun.file(filePath).exists())) {
    throw new Error(`Source file not found: ${filePath}`)
  }
  p.log.info(`File: ${filePath}`)

  const layerInfo = await getSourceLayerInfo(filePath, spec.import.layer)
  p.log.info(
    `Source: ${layerInfo.featureCount.toLocaleString()} features, geometry=${layerInfo.geometryType}, layer=${layerInfo.layerName}`,
  )

  if (!geometryTypesMatch(layerInfo.geometryType, spec.import.expectedGeometryType)) {
    throw new Error(
      `Geometry type mismatch: source=${layerInfo.geometryType} (ogrinfo), spec import.expectedGeometryType=${spec.import.expectedGeometryType}. Set the spec to the WKB name (MultiPoint, MultiPolygon — no spaces).`,
    )
  }

  const spinner = p.spinner()

  // Fresh DBs after Prisma migrations alone may lack `data`; ogr2ogr -lco SCHEMA=data does not create it.
  spinner.start(`Importing into ${SCHEMA}.${spec.table}…`)
  await runPsql(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA};`)
  await runOgr2ogrImport({ filePath, spec })
  spinner.stop(`Imported into ${SCHEMA}.${spec.table}.`)

  spinner.start('Checking row count…')
  const dbCount = await getRowCount(spec.table)
  spinner.stop(`Verified row count: ${dbCount.toLocaleString()}`)
  if (dbCount !== layerInfo.featureCount) {
    throw new Error(`Row count mismatch: source=${layerInfo.featureCount}, database=${dbCount}`)
  }

  for (const index of spec.indexes) {
    const cols = index.columns.join(', ')
    spinner.start(`Creating index ${index.name}…`)
    await runPsql(
      `CREATE INDEX IF NOT EXISTS ${index.name} ON ${SCHEMA}.${spec.table} USING ${index.using} (${cols});`,
    )
    spinner.stop(`Index: ${index.name}`)
  }

  p.outro(`Done. ${SCHEMA}.${spec.table}: ${dbCount.toLocaleString()} rows.`)
}

if (import.meta.main) {
  await runCli(runLoad)
}
