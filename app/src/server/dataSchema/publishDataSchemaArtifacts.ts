import type { DataSchemaManifest } from './dataSchemaManifest.schema'
import {
  dataSchemaLatestDumpKey,
  dataSchemaLatestManifestKey,
  dataSchemaObjectDumpKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotManifestKey,
} from './dataSchemaS3Keys'

export type DataSchemaPublishPuts = {
  putFile: (key: string, filePath: string) => Promise<void>
  putJson: (key: string, value: unknown) => Promise<void>
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

/** Snapshot prefix is unique, so dump-then-manifest cannot clobber a live pointer. */
export async function publishSnapshotDumpAndManifest(
  {
    table,
    snapshotId,
    dumpPath,
    manifest,
  }: {
    table: string
    snapshotId: string
    dumpPath: string
    manifest: DataSchemaManifest
  },
  puts: DataSchemaPublishPuts,
) {
  const snapDumpKey = dataSchemaSnapshotDumpKey(table, snapshotId)
  const snapManifestKey = dataSchemaSnapshotManifestKey(table, snapshotId)
  await puts.putFile(snapDumpKey, dumpPath)
  await puts.putJson(snapManifestKey, manifest)
  return { keys: [snapDumpKey, snapManifestKey] }
}
