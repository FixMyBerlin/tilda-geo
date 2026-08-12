import { existsSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import {
  dumpTableToFile,
  getDataSchemaTableRowCount,
  getPgDumpVersion,
} from './dataSchemaDb.server'
import { createDataSchemaS3Client, putS3FileMultipart, putS3Json } from './dataSchemaS3.server'
import {
  assertDataSchemaTableName,
  dataSchemaLatestDumpKey,
  dataSchemaLatestManifestKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotId,
  dataSchemaSnapshotManifestKey,
} from './dataSchemaS3Keys'
import { resolveLargeForRepublish } from './resolveLargeForRepublish'
import { sha256File } from './sha256File'

export async function publishDataSchemaTableFromEnvironment({
  table,
  snapshot = false,
  userId,
  publishedBy,
  large,
}: {
  table: string
  snapshot?: boolean
  userId?: string | null
  publishedBy?: string
  /** Explicit override; when omitted, inherit from existing latest/manifest.json. */
  large?: boolean
}) {
  assertDataSchemaTableName(table)

  const rowCount = await getDataSchemaTableRowCount(table)
  if (rowCount === null) {
    throw new Error(`Table data.${table} does not exist in this environment.`)
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'data-schema-publish-env-'))
  const dumpPath = join(tempDir, 'table.dump')

  try {
    await dumpTableToFile(table, dumpPath)
    if (!existsSync(dumpPath) || statSync(dumpPath).size <= 0) {
      throw new Error(`Dump file missing or empty: ${dumpPath}`)
    }

    const bytes = statSync(dumpPath).size
    const sha256 = await sha256File(dumpPath)
    const pgDumpVersion = await getPgDumpVersion()
    const publishedAt = new Date().toISOString()
    const publishedFrom =
      process.env.VITE_APP_ENV?.trim() || process.env.ENVIRONMENT?.trim() || 'unknown'
    const by =
      publishedBy?.trim() ||
      userId?.trim() ||
      process.env.USER?.trim() ||
      process.env.LOGNAME?.trim() ||
      'unknown'

    const { client, bucket } = createDataSchemaS3Client()
    const resolvedLarge = await resolveLargeForRepublish(client, bucket, table, large)

    const latestManifest = buildDataSchemaManifest({
      table,
      publishedAt,
      snapshotId: null,
      bytes,
      sha256,
      rowCount,
      large: resolvedLarge,
      pgDumpVersion,
      publishedBy: by,
      publishedFrom,
    })

    const latestDumpKey = dataSchemaLatestDumpKey(table)
    const latestManifestKey = dataSchemaLatestManifestKey(table)

    await putS3FileMultipart(client, bucket, latestDumpKey, dumpPath)
    await putS3Json(client, bucket, latestManifestKey, latestManifest)

    const written = [latestDumpKey, latestManifestKey]
    let snapshotId: string | null = null

    if (snapshot) {
      snapshotId = dataSchemaSnapshotId()
      const snapshotManifest = buildDataSchemaManifest({
        table,
        publishedAt,
        snapshotId,
        bytes,
        sha256,
        rowCount,
        large: resolvedLarge,
        pgDumpVersion,
        publishedBy: by,
        publishedFrom,
      })
      const snapDumpKey = dataSchemaSnapshotDumpKey(table, snapshotId)
      const snapManifestKey = dataSchemaSnapshotManifestKey(table, snapshotId)
      await putS3FileMultipart(client, bucket, snapDumpKey, dumpPath)
      await putS3Json(client, bucket, snapManifestKey, snapshotManifest)
      written.push(snapDumpKey, snapManifestKey)
    }

    return {
      ok: true as const,
      table,
      rowCount,
      bytes,
      sha256,
      snapshotId,
      large: resolvedLarge,
      keys: written,
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
