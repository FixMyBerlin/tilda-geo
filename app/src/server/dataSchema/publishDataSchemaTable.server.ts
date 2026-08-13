import { existsSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import { dumpTableToFile, getDataSchemaTableRowCount } from './dataSchemaDb.server'
import { copyS3Object, putS3File, putS3Json, s3ObjectExists } from './dataSchemaS3.server'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'
import { getLatestDataSchemaManifest } from './getLatestDataSchemaManifest'
import { archiveLatestAsSnapshot, publishLatestDumpAndManifest } from './publishDataSchemaArtifacts'
import { resolveLatestDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'
import { sha256File } from './sha256File'

export async function publishDataSchemaTableFromEnvironment({
  table,
  snapshot = false,
  userId,
  publishedBy,
}: {
  table: string
  snapshot?: boolean
  userId?: string | null
  publishedBy?: string
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
    const publishedAt = new Date().toISOString()
    const publishedFrom =
      process.env.VITE_APP_ENV?.trim() || process.env.ENVIRONMENT?.trim() || 'unknown'
    const by = publishedBy?.trim() || userId?.trim() || 'unknown'

    const previous = await getLatestDataSchemaManifest(table)
    const puts = {
      putFile: (key: string, filePath: string) => putS3File(key, filePath),
      putJson: (key: string, value: unknown) => putS3Json(key, value),
    }

    const latestManifest = buildDataSchemaManifest({
      table,
      publishedAt,
      snapshotId: null,
      bytes,
      sha256,
      rowCount,
      publishedBy: by,
      publishedFrom,
      sourceFile: previous?.provenance.sourceFile,
      sourceSha256: previous?.provenance.sourceSha256,
      specSha256: previous?.provenance.specSha256,
    })

    const written: string[] = []
    let snapshotId: string | null = null

    if (snapshot && previous) {
      const sourceDumpKey = await resolveLatestDataSchemaDumpKey(table, previous.file.sha256)
      const snap = await archiveLatestAsSnapshot(
        { table, previous, sourceDumpKey },
        {
          copyObject: (fromKey, toKey) => copyS3Object(fromKey, toKey),
          putJson: puts.putJson,
          objectExists: (key) => s3ObjectExists(key),
        },
      )
      snapshotId = snap.snapshotId
      written.push(...snap.keys)
    }

    const latest = await publishLatestDumpAndManifest(
      { table, dumpPath, manifest: latestManifest },
      puts,
    )
    written.push(...latest.keys)

    return {
      ok: true as const,
      table,
      rowCount,
      bytes,
      sha256,
      snapshotId,
      keys: written,
      warning: latest.warning,
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
