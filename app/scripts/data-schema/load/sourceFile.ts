import { resolve } from 'node:path'
import {
  dataSchemaLocalSourcePath,
  dataSchemaTableDir,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  dataSchemaSourceExtensions,
  isDataSchemaSourceFile,
} from '@/server/dataSchema/dataSchemaSpec.schema'
import { listFilesByEnding } from '../listFiles'

export function pickFolderSourceFile(input: { table: string; specFile: string; files: string[] }) {
  const allowed = input.files.filter(isDataSchemaSourceFile).sort()
  if (allowed.includes(input.specFile)) return input.specFile
  if (allowed.length === 1) return allowed[0]!
  if (allowed.length === 0) {
    throw new Error(
      `No .geojson or .gpkg in data-schema/${input.table}/. Put the source next to spec.yaml, or pass --file.`,
    )
  }
  throw new Error(
    `Several source files in data-schema/${input.table}/:\n${allowed.map((file) => `  ${file}`).join('\n')}\nLeave one .geojson/.gpkg, or pass --file.`,
  )
}

export async function resolveLoadSourcePath(input: {
  table: string
  specFile: string
  explicitFile?: string
}) {
  if (input.explicitFile) return resolve(input.explicitFile)
  const name = pickFolderSourceFile({
    table: input.table,
    specFile: input.specFile,
    files: await listFilesByEnding(dataSchemaTableDir(input.table), dataSchemaSourceExtensions),
  })
  return dataSchemaLocalSourcePath(input.table, name)
}
