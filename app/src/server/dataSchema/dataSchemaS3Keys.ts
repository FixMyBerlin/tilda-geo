import { dataSchemaIdentifierRegex } from './dataSchemaSpec.schema'

export const DATA_SCHEMA_S3_PREFIX = 'data-schema'

export function assertDataSchemaTableName(table: string) {
  if (!dataSchemaIdentifierRegex.test(table)) {
    throw new Error(
      `Invalid data-schema table name "${table}" (must match ${dataSchemaIdentifierRegex}).`,
    )
  }
  return table
}

function dataSchemaLatestPrefix(table: string) {
  return `${DATA_SCHEMA_S3_PREFIX}/${assertDataSchemaTableName(table)}/latest`
}

export function dataSchemaLatestDumpKey(table: string) {
  return `${dataSchemaLatestPrefix(table)}/table.dump`
}

export function dataSchemaLatestManifestKey(table: string) {
  return `${dataSchemaLatestPrefix(table)}/manifest.json`
}

const sha256HexRegex = /^[a-f0-9]{64}$/

/** Immutable dump keyed by content hash. Written before latest/manifest.json so a failed pointer update cannot strand a new dump under latest/. */
export function dataSchemaObjectDumpKey(table: string, sha256: string) {
  if (!sha256HexRegex.test(sha256)) {
    throw new Error(`Invalid dump sha256 "${sha256}" (expected 64 lowercase hex chars).`)
  }
  return `${DATA_SCHEMA_S3_PREFIX}/${assertDataSchemaTableName(table)}/objects/${sha256}.dump`
}

export function isDataSchemaSha256Hex(sha256: string) {
  return sha256HexRegex.test(sha256)
}

function dataSchemaSourcesPrefix(table: string) {
  return `${DATA_SCHEMA_S3_PREFIX}/${assertDataSchemaTableName(table)}/sources`
}

export function dataSchemaSpecKey(table: string) {
  return `${dataSchemaSourcesPrefix(table)}/spec.json`
}

function dataSchemaSnapshotPrefix(table: string, snapshotId: string) {
  if (!/^\d{8}T\d{4}$/.test(snapshotId)) {
    throw new Error(`Invalid snapshotId "${snapshotId}" (expected YYYYMMDDTHHmm UTC).`)
  }
  return `${DATA_SCHEMA_S3_PREFIX}/${assertDataSchemaTableName(table)}/snapshots/${snapshotId}`
}

export function dataSchemaSnapshotDumpKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/table.dump`
}

export function dataSchemaSnapshotManifestKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/manifest.json`
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
