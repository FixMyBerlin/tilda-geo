import type { DataSchemaManifest } from './dataSchemaManifest.schema'
import {
  dataSchemaDumpKey,
  dataSchemaManifestKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotId,
  dataSchemaSnapshotManifestKey,
  dataSchemaSnapshotSpecKey,
  dataSchemaSpecKey,
} from './dataSchemaS3Keys'

export type DataSchemaPublishPuts = {
  putFile: (key: string, filePath: string) => Promise<void>
  putJson: (key: string, value: unknown) => Promise<void>
}

export type DataSchemaArchivePuts = {
  copyObject: (fromKey: string, toKey: string) => Promise<void>
  putJson: (key: string, value: unknown) => Promise<void>
  objectExists: (key: string) => Promise<boolean>
}

/** Replace data.dump, then data.manifest.json. */
export async function publishLatestDumpAndManifest(
  {
    table,
    dumpPath,
    manifest,
  }: {
    table: string
    dumpPath: string
    manifest: DataSchemaManifest
  },
  puts: DataSchemaPublishPuts,
) {
  const dumpKey = dataSchemaDumpKey(table)
  const manifestKey = dataSchemaManifestKey(table)

  await puts.putFile(dumpKey, dumpPath)
  await puts.putJson(manifestKey, manifest)

  return { keys: [dumpKey, manifestKey], warning: null as string | null }
}

/**
 * Copy the current spec + dump aside before the next publish overwrites them.
 * Snapshot id is the previous publishedAt (UTC minute). No-op if that snapshot already exists.
 */
export async function archiveLatestAsSnapshot(
  {
    table,
    previous,
    sourceDumpKey,
  }: {
    table: string
    previous: DataSchemaManifest
    sourceDumpKey: string
  },
  puts: DataSchemaArchivePuts,
) {
  const publishedMs = Date.parse(previous.publishedAt)
  if (Number.isNaN(publishedMs)) {
    throw new Error(`Cannot archive latest: invalid publishedAt "${previous.publishedAt}"`)
  }
  const snapshotId = dataSchemaSnapshotId(new Date(publishedMs))
  const snapSpecKey = dataSchemaSnapshotSpecKey(table, snapshotId)
  const snapDumpKey = dataSchemaSnapshotDumpKey(table, snapshotId)
  const snapManifestKey = dataSchemaSnapshotManifestKey(table, snapshotId)

  if (await puts.objectExists(snapManifestKey)) {
    return { keys: [snapManifestKey], snapshotId, skipped: true as const }
  }

  await puts.copyObject(dataSchemaSpecKey(table), snapSpecKey)
  await puts.copyObject(sourceDumpKey, snapDumpKey)
  await puts.putJson(snapManifestKey, { ...previous, snapshotId })
  return { keys: [snapSpecKey, snapDumpKey, snapManifestKey], snapshotId, skipped: false as const }
}
