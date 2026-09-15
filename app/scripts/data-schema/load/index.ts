#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  type DataSchemaSpec,
  dataSchemaSourceKind,
} from '@/server/dataSchema/dataSchemaSpec.schema'
import { runCli } from '../cli'
import { SCHEMA, assertDevelopmentEnvironment, getRowCount, runPsql, runPsqlFile } from '../db'
import { resolveRequiredTable } from '../localTables'
import { parseLoadArgs, printLoadHelp } from './args'
import { assertGdalPresent, getSourceLayerInfo, runOgr2ogrImport } from './ogr'
import { geometryTypesMatch } from './ogrHelpers'
import { resolveLoadSourcePath } from './sourceFile'

async function loadSqlDump(input: { filePath: string; spec: DataSchemaSpec }) {
  const spinner = p.spinner()
  spinner.start(`Loading SQL dump into ${SCHEMA}.${input.spec.table}…`)
  await runPsqlFile(input.filePath)
  spinner.stop(`Loaded SQL dump into ${SCHEMA}.${input.spec.table}.`)

  p.log.info(`Row count: ${(await getRowCount(input.spec.table)).toLocaleString()}`)
}

async function loadOgrSource(input: { filePath: string; spec: DataSchemaSpec }) {
  const { filePath, spec } = input
  if (!spec.import) {
    throw new Error(
      `Spec for "${spec.table}" is missing import (required for .geojson/.gpkg). Add import or use a .sql source.`,
    )
  }
  await assertGdalPresent()

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
  spinner.start(`Importing into ${SCHEMA}.${spec.table}…`)
  await runOgr2ogrImport({ filePath, spec: { ...spec, import: spec.import } })
  spinner.stop(`Imported into ${SCHEMA}.${spec.table}.`)

  spinner.start('Checking row count…')
  const dbCount = await getRowCount(spec.table)
  spinner.stop(`Verified row count: ${dbCount.toLocaleString()}`)
  if (dbCount !== layerInfo.featureCount) {
    throw new Error(`Row count mismatch: source=${layerInfo.featureCount}, database=${dbCount}`)
  }
}

async function createDeclaredIndexes(spec: DataSchemaSpec) {
  const spinner = p.spinner()
  for (const index of spec.indexes) {
    const cols = index.columns.join(', ')
    spinner.start(`Creating index ${index.name}…`)
    await runPsql(
      `CREATE INDEX IF NOT EXISTS ${index.name} ON ${SCHEMA}.${spec.table} USING ${index.using} (${cols});`,
    )
    spinner.stop(`Index: ${index.name}`)
  }
}

async function runLoad(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printLoadHelp()
    return
  }

  const options = parseLoadArgs(argv)
  assertDevelopmentEnvironment()

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

  // Fresh DBs after Prisma migrations alone may lack `data`; ogr2ogr -lco SCHEMA=data does not create it.
  await runPsql(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA};`)

  switch (dataSchemaSourceKind(spec.source.file)) {
    case 'sql':
      await loadSqlDump({ filePath, spec })
      break
    case 'ogr':
      await loadOgrSource({ filePath, spec })
      break
  }

  // Indexes use IF NOT EXISTS, so declaring one a SQL dump already created is harmless.
  await createDeclaredIndexes(spec)

  p.outro(
    `Done. ${SCHEMA}.${spec.table}: ${(await getRowCount(spec.table)).toLocaleString()} rows.`,
  )
}

if (import.meta.main) {
  await runCli(runLoad)
}
