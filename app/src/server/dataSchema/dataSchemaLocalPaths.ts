import { resolve } from 'node:path'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'
import { isDataSchemaSourceBasename, parseDataSchemaSpec } from './dataSchemaSpec.schema'

/** Repo-root `data-schema/` resolved from this module (`app/src/server/dataSchema`). */
export function dataSchemaRootDir() {
  return resolve(import.meta.dir, '../../../../data-schema')
}

function dataSchemaTableDir(table: string) {
  return resolve(dataSchemaRootDir(), assertDataSchemaTableName(table))
}

export function dataSchemaLocalSpecPath(table: string) {
  return resolve(dataSchemaTableDir(table), 'spec.json')
}

export async function loadLocalSpec(table: string) {
  const specFile = Bun.file(dataSchemaLocalSpecPath(table))
  if (!(await specFile.exists())) return null
  return parseDataSchemaSpec(await specFile.json(), table)
}

export function dataSchemaLocalSourcePath(table: string, sourceFile: string) {
  if (!isDataSchemaSourceBasename(sourceFile)) {
    throw new Error(`Invalid sourceFile "${sourceFile}" (basename only, no path separators).`)
  }
  return resolve(dataSchemaTableDir(table), sourceFile)
}
