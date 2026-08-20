import { resolve } from 'node:path'
import { DATA_SCHEMA_SPEC_FILENAME, assertDataSchemaTableName } from './dataSchemaS3Keys'
import { isDataSchemaSourceFile, type DataSchemaSpec } from './dataSchemaSpec.schema'
import { parseDataSchemaSpecText, stringifyDataSchemaSpec } from './dataSchemaSpec.yaml'

/** Repo-root `data-schema/` resolved from this module (`app/src/server/dataSchema`). */
export function dataSchemaRootDir() {
  return resolve(import.meta.dir, '../../../../data-schema')
}

export function dataSchemaTableDir(table: string) {
  return resolve(dataSchemaRootDir(), assertDataSchemaTableName(table))
}

export function dataSchemaLocalSpecPath(table: string) {
  return resolve(dataSchemaTableDir(table), DATA_SCHEMA_SPEC_FILENAME)
}

export async function loadLocalSpec(table: string) {
  const specFile = Bun.file(dataSchemaLocalSpecPath(table))
  if (!(await specFile.exists())) return null
  return parseDataSchemaSpecText(await specFile.text(), table)
}

export async function writeLocalSpec(table: string, spec: DataSchemaSpec) {
  const specPath = dataSchemaLocalSpecPath(table)
  await Bun.write(specPath, stringifyDataSchemaSpec(spec))
  return specPath
}

export function dataSchemaLocalSourcePath(table: string, sourceFile: string) {
  if (!isDataSchemaSourceFile(sourceFile)) {
    throw new Error(`Invalid sourceFile "${sourceFile}" (.geojson or .gpkg basename only).`)
  }
  return resolve(dataSchemaTableDir(table), sourceFile)
}
