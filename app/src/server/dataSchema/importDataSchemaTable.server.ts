import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DataSchemaImportStatus } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { assertManifestMatchesTable } from './buildDataSchemaManifest'
import {
  dataSchemaTableExists,
  dropTableIfExists,
  ensureDataSchemaExists,
  expectedAsideTableName,
  pgRestoreListTables,
  renameTableAside,
  restoreTableAside,
  withDataSchemaImportLock,
} from './dataSchemaDb.server'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import {
  createDataSchemaS3Client,
  downloadS3ObjectToFile,
  getS3ObjectJson,
  listDataSchemaTables,
} from './dataSchemaS3.server'
import {
  assertDataSchemaTableName,
  dataSchemaLatestDumpKey,
  dataSchemaLatestManifestKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotManifestKey,
} from './dataSchemaS3Keys'
import { assertDumpContainsOnlyTable } from './parsePgRestoreToc'
import type { AsideRenameMapping } from './pgIdentifier'
import { type AsideHolder, restoreVerifyDataSchemaTable } from './restoreVerifyDataSchemaTable'
import { sha256File } from './sha256File'

const ERROR_TEXT_MAX = 10_000
const ASIDE_SUFFIX = '__old'

function truncateErrorText(message: string) {
  if (message.length <= ERROR_TEXT_MAX) return message
  return `${message.slice(0, ERROR_TEXT_MAX)}…`
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function rollbackAsideBestEffort(mapping: AsideRenameMapping | null, liveTable: string) {
  if (!mapping) return
  try {
    // Live table may still exist after a failed drop — remove it so aside can move back.
    if (await dataSchemaTableExists(liveTable)) {
      await dropTableIfExists(`data.${liveTable}`)
    }
    await restoreTableAside(mapping)
  } catch (rollbackError) {
    throw new Error(
      `Import fehlgeschlagen und Rollback unvollständig — manuelle Intervention nötig: data.${mapping.table.to} ggf. nach data.${mapping.table.from} zurückbenennen. Rollback-Fehler: ${errorMessage(rollbackError)}`,
    )
  }
}

export async function importDataSchemaTable({
  table,
  snapshotId,
  userId,
}: {
  table: string
  snapshotId?: string | null
  userId?: string | null
}) {
  assertDataSchemaTableName(table)
  const { client, bucket } = createDataSchemaS3Client()

  const manifestKey = snapshotId
    ? dataSchemaSnapshotManifestKey(table, snapshotId)
    : dataSchemaLatestManifestKey(table)
  const dumpKey = snapshotId
    ? dataSchemaSnapshotDumpKey(table, snapshotId)
    : dataSchemaLatestDumpKey(table)

  const rawManifest = await getS3ObjectJson(client, bucket, manifestKey)
  const manifest = dataSchemaManifestSchema.parse(rawManifest)
  assertManifestMatchesTable(manifest, table)

  const startedAt = Date.now()
  const history = await db.dataSchemaImport.create({
    data: {
      tableName: table,
      publishedAt: new Date(manifest.publishedAt),
      snapshotId: snapshotId ?? null,
      sha256: manifest.file.sha256,
      status: 'PENDING' satisfies DataSchemaImportStatus,
      userId: userId ?? null,
    },
  })

  await db.dataSchemaImport.update({
    where: { id: history.id },
    data: { status: 'RUNNING' },
  })

  const tempDir = await mkdtemp(join(tmpdir(), 'data-schema-import-'))
  const dumpPath = join(tempDir, 'table.dump')
  const aside: AsideHolder = { mapping: null }

  try {
    return await withDataSchemaImportLock(table, async () => {
      try {
        const orphanAside = expectedAsideTableName(table, ASIDE_SUFFIX)
        if (await dataSchemaTableExists(orphanAside)) {
          throw new Error(
            `Orphan-Tabelle data.${orphanAside} vorhanden (vermutlich unterbrochener Import / Container-Neustart). Bitte manuell nach data.${table} zurückbenennen oder droppen, bevor erneut importiert wird.`,
          )
        }

        await downloadS3ObjectToFile(client, bucket, dumpKey, dumpPath)
        const actualSha = await sha256File(dumpPath)
        if (actualSha !== manifest.file.sha256) {
          throw new Error(
            `SHA-256 mismatch for ${dumpKey}: expected ${manifest.file.sha256}, got ${actualSha}`,
          )
        }

        const { stdout } = await pgRestoreListTables(dumpPath)
        assertDumpContainsOnlyTable(stdout, table)

        // Ensure schema exists before rename/restore — dumps from `pg_dump --table=data.*` omit CREATE SCHEMA.
        await ensureDataSchemaExists()

        if (await dataSchemaTableExists(table)) {
          aside.mapping = await renameTableAside(table, ASIDE_SUFFIX)
        }

        // Restore/verify/aside-drop only — bookkeeping stays outside so a Prisma hiccup cannot drop a good table.
        const { rowCount, asideDropWarning } = await restoreVerifyDataSchemaTable({
          dumpPath,
          table,
          expectedRowCount: manifest.rowCount,
          aside,
        })

        const durationMs = Date.now() - startedAt
        if (asideDropWarning) {
          await db.dataSchemaImport.update({
            where: { id: history.id },
            data: {
              status: 'SUCCESS',
              rowCount,
              durationMs,
              errorText: truncateErrorText(asideDropWarning),
            },
          })
          return {
            ok: true as const,
            rowCount,
            durationMs,
            importId: history.id,
            warning: asideDropWarning,
          }
        }

        await db.dataSchemaImport.update({
          where: { id: history.id },
          data: {
            status: 'SUCCESS',
            rowCount,
            durationMs,
            errorText: null,
          },
        })

        return { ok: true as const, rowCount, durationMs, importId: history.id }
      } catch (error) {
        // Rollback while the advisory lock is still held so a concurrent import cannot interleave.
        if (aside.mapping) {
          try {
            await rollbackAsideBestEffort(aside.mapping, table)
            aside.mapping = null
          } catch (rollbackError) {
            throw new Error(`${errorMessage(error)}; ${errorMessage(rollbackError)}`, {
              cause: error,
            })
          }
        }
        throw error
      }
    })
  } catch (error) {
    // aside.mapping is normally cleared inside the lock (success or rollback). Defensive only.
    let message = truncateErrorText(errorMessage(error))
    if (aside.mapping) {
      try {
        await rollbackAsideBestEffort(aside.mapping, table)
        aside.mapping = null
      } catch (rollbackError) {
        message = truncateErrorText(`${message}; ${errorMessage(rollbackError)}`)
      }
    }
    await db.dataSchemaImport.update({
      where: { id: history.id },
      data: {
        status: 'FAILED',
        durationMs: Date.now() - startedAt,
        errorText: message,
      },
    })
    throw new Error(message, { cause: error })
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function importAllDataSchemaTables({
  includeLarge = false,
  userId,
}: {
  includeLarge?: boolean
  userId?: string | null
}) {
  const { client, bucket } = createDataSchemaS3Client()
  const tables = await listDataSchemaTables(client, bucket)
  const results: Array<{
    table: string
    ok: boolean
    skipped?: boolean
    reason?: string
    rowCount?: number
    durationMs?: number
    error?: string
  }> = []

  for (const table of tables) {
    try {
      const raw = await getS3ObjectJson(client, bucket, dataSchemaLatestManifestKey(table))
      const manifest = dataSchemaManifestSchema.parse(raw)
      if (manifest.large && !includeLarge) {
        results.push({
          table,
          ok: true,
          skipped: true,
          reason: 'large (skipped; pass includeLarge to import)',
        })
        continue
      }
      const result = await importDataSchemaTable({ table, userId })
      results.push({
        table,
        ok: true,
        rowCount: result.rowCount,
        durationMs: result.durationMs,
      })
    } catch (error) {
      results.push({
        table,
        ok: false,
        error: truncateErrorText(errorMessage(error)),
      })
    }
  }

  return results
}
