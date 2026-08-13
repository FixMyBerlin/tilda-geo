#!/usr/bin/env bun
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
  loadLocalSpec,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import { runCli } from '../cli'
import { SCHEMA, assertDevelopmentEnvironment, getRowCount, runPsql } from '../db'
import { parseLoadArgs, printLoadHelp } from './args'
import { assertGdalPresent, getSourceLayerInfo, runOgr2ogrImport } from './ogr'
import { geometryTypesMatch } from './ogrHelpers'

async function runLoad(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printLoadHelp()
    return
  }

  const options = parseLoadArgs(argv)
  assertDevelopmentEnvironment()
  await assertGdalPresent()

  const spec = await loadLocalSpec(options.table)
  if (!spec) {
    throw new Error(
      `Local spec not found: ${dataSchemaLocalSpecPath(options.table)} (run data-schema-pull or create it first)`,
    )
  }

  const filePath = options.file
    ? resolve(options.file)
    : dataSchemaLocalSourcePath(options.table, spec.source.file)

  if (!(await Bun.file(filePath).exists())) {
    throw new Error(`Source file not found: ${filePath}`)
  }

  p.intro('data-schema-load')
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

  const spinner = p.spinner()
  spinner.start(`Importing into ${SCHEMA}.${spec.table}…`)
  await runOgr2ogrImport({ filePath, spec })
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

if (import.meta.main) {
  await runCli(runLoad)
}
