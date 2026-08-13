import type { DataSchemaManifest } from './dataSchemaManifest.schema'
import {
  dataSchemaLatestDumpKey,
  dataSchemaLatestManifestKey,
  dataSchemaObjectDumpKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotId,
  dataSchemaSnapshotManifestKey,
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

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Publish latest: immutable object dump, then latest/manifest.json (the pointer),
 * then a convenience copy at latest/table.dump.
 *
 * Overwriting latest/table.dump before the manifest can leave a new dump with an old
 * sha256 so later imports fail until republish.
 */
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
  const objectKey = dataSchemaObjectDumpKey(table, manifest.file.sha256)
  const latestManifestKey = dataSchemaLatestManifestKey(table)
  const latestDumpKey = dataSchemaLatestDumpKey(table)

  await puts.putFile(objectKey, dumpPath)
  await puts.putJson(latestManifestKey, manifest)

  let warning: string | null = null
  try {
    await puts.putFile(latestDumpKey, dumpPath)
  } catch (error) {
    warning = `Latest-Manifest ist aktuell, aber ${latestDumpKey} konnte nicht überschrieben werden: ${errorMessage(error)}. Import nutzt ${objectKey}.`
  }

  return {
    keys: warning ? [objectKey, latestManifestKey] : [objectKey, latestManifestKey, latestDumpKey],
    warning,
  }
}

/**
 * Keep the current latest dump importable after the next publish overwrites latest/.
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
  const snapDumpKey = dataSchemaSnapshotDumpKey(table, snapshotId)
  const snapManifestKey = dataSchemaSnapshotManifestKey(table, snapshotId)

  if (await puts.objectExists(snapManifestKey)) {
    return { keys: [snapManifestKey], snapshotId, skipped: true as const }
  }

  await puts.copyObject(sourceDumpKey, snapDumpKey)
  await puts.putJson(snapManifestKey, { ...previous, snapshotId })
  return { keys: [snapDumpKey, snapManifestKey], snapshotId, skipped: false as const }
}
