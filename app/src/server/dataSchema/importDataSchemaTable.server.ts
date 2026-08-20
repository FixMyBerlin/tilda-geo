import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DataSchemaImportStatus } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { pgRestoreList, replaceTableFromDump } from './dataSchemaDb.server'
import { downloadS3ObjectToFile, getDataSchemaManifestIfExists } from './dataSchemaS3.server'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'
import { assertDumpContainsOnlyTable } from './parsePgRestoreToc'
import { resolveDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'
import { sha256File } from './sha256File'

const ERROR_TEXT_MAX = 10_000

function truncateErrorText(message: string) {
  if (message.length <= ERROR_TEXT_MAX) return message
  return `${message.slice(0, ERROR_TEXT_MAX)}…`
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
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

  const manifest = await getDataSchemaManifestIfExists(table, snapshotId)
  if (!manifest) {
    throw new Error(
      snapshotId
        ? `No snapshot manifest for data.${table} (${snapshotId})`
        : `No data.manifest.json for data.${table}`,
    )
  }

  const dumpKey = await resolveDataSchemaDumpKey(table, snapshotId)

  const startedAt = Date.now()
  const history = await db.dataSchemaImport.create({
    data: {
      tableName: table,
      publishedAt: new Date(manifest.publishedAt),
      snapshotId: snapshotId ?? null,
      sha256: manifest.sha256,
      status: 'PENDING' satisfies DataSchemaImportStatus,
      createdById: userId ?? null,
      updatedById: userId ?? null,
    },
  })

  await db.dataSchemaImport.update({
    where: { id: history.id },
    data: { status: 'RUNNING', updatedById: userId ?? null },
  })

  const tempDir = await mkdtemp(join(tmpdir(), 'data-schema-import-'))
  const dumpPath = join(tempDir, 'table.dump')
  let restoreCommitted = false
  let committedRowCount: number | undefined

  try {
    await downloadS3ObjectToFile(dumpKey, dumpPath)
    const actualSha = await sha256File(dumpPath)
    if (actualSha !== manifest.sha256) {
      throw new Error(
        `SHA-256 mismatch for ${dumpKey}: expected ${manifest.sha256}, got ${actualSha}`,
      )
    }

    const stdout = await pgRestoreList(dumpPath)
    assertDumpContainsOnlyTable(stdout, table)

    const rowCount = await replaceTableFromDump(table, dumpPath, manifest.rowCount)
    restoreCommitted = true
    committedRowCount = rowCount

    const durationMs = Date.now() - startedAt
    try {
      await db.dataSchemaImport.update({
        where: { id: history.id },
        data: {
          status: 'SUCCESS',
          rowCount,
          durationMs,
          errorText: null,
          updatedById: userId ?? null,
        },
      })
    } catch (bookkeepingError) {
      const warning = `Import OK, aber Verlaufseintrag konnte nicht auf SUCCESS gesetzt werden: ${errorMessage(bookkeepingError)}`
      return {
        ok: true as const,
        rowCount,
        durationMs,
        importId: history.id,
        warning,
      }
    }

    return { ok: true as const, rowCount, durationMs, importId: history.id }
  } catch (error) {
    if (restoreCommitted) {
      const durationMs = Date.now() - startedAt
      const warning = `Import OK, aber Verlaufseintrag konnte nicht auf SUCCESS gesetzt werden: ${errorMessage(error)}`
      try {
        await db.dataSchemaImport.update({
          where: { id: history.id },
          data: {
            status: 'SUCCESS',
            rowCount: committedRowCount,
            durationMs,
            errorText: truncateErrorText(warning),
            updatedById: userId ?? null,
          },
        })
      } catch {
        // Leave RUNNING rather than FAILED — the live table is already replaced.
      }
      return {
        ok: true as const,
        rowCount: committedRowCount!,
        durationMs,
        importId: history.id,
        warning,
      }
    }

    const message = truncateErrorText(errorMessage(error))
    await db.dataSchemaImport.update({
      where: { id: history.id },
      data: {
        status: 'FAILED',
        durationMs: Date.now() - startedAt,
        errorText: message,
        updatedById: userId ?? null,
      },
    })
    throw new Error(message, { cause: error })
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
