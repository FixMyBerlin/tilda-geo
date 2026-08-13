import { assertManifestMatchesTable } from './buildDataSchemaManifest'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import { getS3ObjectJsonIfExists } from './dataSchemaS3.server'
import { dataSchemaLatestManifestKey } from './dataSchemaS3Keys'

export function parseLatestDataSchemaManifest(raw: unknown, table: string) {
  const parsed = dataSchemaManifestSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new Error(`Invalid latest manifest for "${table}": ${detail}`)
  }
  assertManifestMatchesTable(parsed.data, table)
  return parsed.data
}

export async function getLatestDataSchemaManifest(table: string) {
  const raw = await getS3ObjectJsonIfExists(dataSchemaLatestManifestKey(table))
  if (!raw) return null
  return parseLatestDataSchemaManifest(raw, table)
}
