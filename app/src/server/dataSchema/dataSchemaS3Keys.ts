import { utc } from '@date-fns/utc'
import { format } from 'date-fns'
import { dataSchemaIdentifierRegex, dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'

const SNAPSHOT_ID_FORMAT = "yyyyMMdd'T'HHmm"

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

export const dataSchemaSnapshotIdRegex = /^\d{8}T\d{4}$/

export function dataSchemaSnapshotsPrefix(table: string) {
  return `${tablePrefix(table)}/snapshots/`
}

function dataSchemaSnapshotPrefix(table: string, snapshotId: string) {
  if (!dataSchemaSnapshotIdRegex.test(snapshotId)) {
    throw new Error(`Invalid snapshotId "${snapshotId}" (expected YYYYMMDDTHHmm UTC).`)
  }
  return `${dataSchemaSnapshotsPrefix(table)}${snapshotId}`
}

export function parseDataSchemaTableFolder(commonPrefix: string) {
  const root = `${DATA_SCHEMA_S3_PREFIX}/`
  if (!commonPrefix.startsWith(root) || !commonPrefix.endsWith('/')) return null
  const name = commonPrefix.slice(root.length, -1)
  const parsed = dataSchemaIdentifierSchema.safeParse(name)
  return parsed.success ? parsed.data : null
}

export function parseDataSchemaSnapshotFolder(commonPrefix: string, table: string) {
  const prefix = dataSchemaSnapshotsPrefix(table)
  if (!commonPrefix.startsWith(prefix) || !commonPrefix.endsWith('/')) return null
  const id = commonPrefix.slice(prefix.length, -1)
  return dataSchemaSnapshotIdRegex.test(id) ? id : null
}

export function dataSchemaSnapshotSpecKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/spec.json`
}

export function dataSchemaSnapshotDumpKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/data.dump`
}

export function dataSchemaSnapshotManifestKey(table: string, snapshotId: string) {
  return `${dataSchemaSnapshotPrefix(table, snapshotId)}/data.manifest.json`
}

/** UTC snapshot id: YYYYMMDDTHHmm */
export function dataSchemaSnapshotId(date: Date = new Date()) {
  return format(date, SNAPSHOT_ID_FORMAT, { in: utc })
}
