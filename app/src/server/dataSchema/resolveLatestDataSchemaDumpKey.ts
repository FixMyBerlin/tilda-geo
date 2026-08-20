import { s3ObjectExists } from './dataSchemaS3.server'
import { dataSchemaDumpKey, dataSchemaSnapshotDumpKey } from './dataSchemaS3Keys'

export async function resolveDataSchemaDumpKey(table: string, snapshotId?: string | null) {
  const key = snapshotId ? dataSchemaSnapshotDumpKey(table, snapshotId) : dataSchemaDumpKey(table)
  if (await s3ObjectExists(key)) return key
  throw new Error(`No dump object at ${key}`)
}
