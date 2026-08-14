import { s3ObjectExists } from './dataSchemaS3.server'
import { dataSchemaDumpReadKeys } from './dataSchemaS3Keys'

/** Current data.dump, then leftover objects/ or latest/table.dump / snapshot table.dump. */
export async function resolveDataSchemaDumpKey(
  table: string,
  sha256: string,
  snapshotId?: string | null,
) {
  const keys = dataSchemaDumpReadKeys(table, sha256, snapshotId)
  for (const key of keys) {
    if (await s3ObjectExists(key)) return key
  }
  const where = snapshotId ? ` snapshot ${snapshotId}` : ''
  throw new Error(`No dump object for data.${table}${where} (tried ${keys.join(', ')})`)
}
