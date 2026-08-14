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

const sha256HexRegex = /^[a-f0-9]{64}$/

export function isDataSchemaSha256Hex(sha256: string) {
  return sha256HexRegex.test(sha256)
}

/** Pre-flatten layout. Read-only fallback until tables are republished. */
export function dataSchemaLegacySpecKey(table: string) {
  return `${tablePrefix(table)}/sources/spec.json`
}

export function dataSchemaLegacyLatestDumpKey(table: string) {
  return `${tablePrefix(table)}/latest/table.dump`
}

export function dataSchemaLegacyLatestManifestKey(table: string) {
  return `${tablePrefix(table)}/latest/manifest.json`
}

export function dataSchemaLegacyObjectDumpKey(table: string, sha256: string) {
  if (!sha256HexRegex.test(sha256)) {
    throw new Error(`Invalid dump sha256 "${sha256}" (expected 64 lowercase hex chars).`)
  }
  return `${tablePrefix(table)}/objects/${sha256}.dump`
}

export function dataSchemaLegacySnapshotDumpKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/table.dump`
}

export function dataSchemaLegacySnapshotManifestKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/manifest.json`
}

export function dataSchemaSpecReadKeys(table: string) {
  return [dataSchemaSpecKey(table), dataSchemaLegacySpecKey(table)]
}

export function dataSchemaManifestReadKeys(table: string, snapshotId?: string | null) {
  if (snapshotId) {
    return [
      dataSchemaSnapshotManifestKey(table, snapshotId),
      dataSchemaLegacySnapshotManifestKey(table, snapshotId),
    ]
  }
  return [dataSchemaManifestKey(table), dataSchemaLegacyLatestManifestKey(table)]
}

export function dataSchemaDumpReadKeys(table: string, sha256: string, snapshotId?: string | null) {
  const hashed = isDataSchemaSha256Hex(sha256) ? [dataSchemaLegacyObjectDumpKey(table, sha256)] : []
  if (snapshotId) {
    return [
      dataSchemaSnapshotDumpKey(table, snapshotId),
      dataSchemaLegacySnapshotDumpKey(table, snapshotId),
      ...hashed,
    ]
  }
  return [dataSchemaDumpKey(table), ...hashed, dataSchemaLegacyLatestDumpKey(table)]
}
