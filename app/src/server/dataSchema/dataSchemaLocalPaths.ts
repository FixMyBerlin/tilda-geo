import { basename, resolve } from 'node:path'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'

/** Repo-root `data-schema/` resolved from this module (`app/src/server/dataSchema`). */
export function dataSchemaRootDir() {
  return resolve(import.meta.dir, '../../../../data-schema')
}

export function dataSchemaTableDir(table: string) {
  return resolve(dataSchemaRootDir(), assertDataSchemaTableName(table))
}

export function dataSchemaLocalSpecPath(table: string) {
  return resolve(dataSchemaTableDir(table), 'spec.json')
}

export function dataSchemaLocalSourcePath(table: string, sourceFile: string) {
  if (basename(sourceFile) !== sourceFile || sourceFile === '.' || sourceFile === '..') {
    throw new Error(`Invalid sourceFile "${sourceFile}" (basename only, no path separators).`)
  }
  return resolve(dataSchemaTableDir(table), sourceFile)
}
