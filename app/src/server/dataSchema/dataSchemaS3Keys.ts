import { dataSchemaIdentifierRegex, dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'

export const DATA_SCHEMA_S3_PREFIX = 'data-schema'

export function assertDataSchemaTableName(table: string) {
  const parsed = dataSchemaIdentifierSchema.safeParse(table)
  if (!parsed.success) {
    throw new Error(
      `Invalid data-schema table name "${table}" (must match ${dataSchemaIdentifierRegex}, max 63 chars).`,
    )
  }
  return parsed.data
}

function tablePrefix(table: string) {
  return `${DATA_SCHEMA_S3_PREFIX}/${assertDataSchemaTableName(table)}`
}

export function dataSchemaSpecKey(table: string) {
  return `${tablePrefix(table)}/spec.json`
}

export function dataSchemaDumpKey(table: string) {
  return `${tablePrefix(table)}/data.dump`
}

export function dataSchemaManifestKey(table: string) {
  return `${tablePrefix(table)}/data.manifest.json`
}

function dataSchemaSnapshotPrefix(table: string, snapshotId: string) {
  if (!/^\d{8}T\d{4}$/.test(snapshotId)) {
    throw new Error(`Invalid snapshotId "${snapshotId}" (expected YYYYMMDDTHHmm UTC).`)
  }
  return `${tablePrefix(table)}/snapshots/${snapshotId}`
}

export function dataSchemaSnapshotDumpKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/data.dump`
}

export function dataSchemaSnapshotManifestKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/data.manifest.json`
}

/** UTC snapshot id: YYYYMMDDTHHmm */
export function dataSchemaSnapshotId(date: Date = new Date()) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}`
}
