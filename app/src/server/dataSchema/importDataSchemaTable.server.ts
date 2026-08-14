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
import { downloadS3ObjectToFile, getS3ObjectJsonFirst } from './dataSchemaS3.server'
import { assertDataSchemaTableName, dataSchemaManifestReadKeys } from './dataSchemaS3Keys'
import { assertDumpContainsOnlyTable } from './parsePgRestoreToc'
import type { AsideRenameMapping } from './pgIdentifier'
import { resolveDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'
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

function joinWarnings(...parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.length > 0)).join('; ')
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

  const manifestHit = await getS3ObjectJsonFirst(dataSchemaManifestReadKeys(table, snapshotId))
  if (!manifestHit) {
    throw new Error(
      snapshotId
        ? `No snapshot manifest for data.${table} (${snapshotId})`
        : `No data.manifest.json for data.${table}`,
    )
  }
  const manifest = dataSchemaManifestSchema.parse(manifestHit.json)
  assertManifestMatchesTable(manifest, table)

  const dumpKey = await resolveDataSchemaDumpKey(table, manifest.sha256, snapshotId)

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
  const aside: AsideHolder = { mapping: null }
  let restoreCommitted = false
  let committedRowCount: number | undefined
  let committedWarning: string | null = null

  try {
    return await withDataSchemaImportLock(table, async () => {
      try {
        const orphanAside = expectedAsideTableName(table, ASIDE_SUFFIX)
        if (await dataSchemaTableExists(orphanAside)) {
          throw new Error(
            `Orphan-Tabelle data.${orphanAside} vorhanden (vermutlich unterbrochener Import / Container-Neustart). Bitte manuell nach data.${table} zurückbenennen oder droppen, bevor erneut importiert wird.`,
          )
        }

        await downloadS3ObjectToFile(dumpKey, dumpPath)
        const actualSha = await sha256File(dumpPath)
        if (actualSha !== manifest.sha256) {
          throw new Error(
            `SHA-256 mismatch for ${dumpKey}: expected ${manifest.sha256}, got ${actualSha}`,
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
        restoreCommitted = true
        committedRowCount = rowCount
        committedWarning = asideDropWarning

        const durationMs = Date.now() - startedAt
        try {
          await db.dataSchemaImport.update({
            where: { id: history.id },
            data: {
              status: 'SUCCESS',
              rowCount,
              durationMs,
              errorText: asideDropWarning ? truncateErrorText(asideDropWarning) : null,
              updatedById: userId ?? null,
            },
          })
        } catch (bookkeepingError) {
          const warning = joinWarnings(
            asideDropWarning,
            `Import OK, aber Verlaufseintrag konnte nicht auf SUCCESS gesetzt werden: ${errorMessage(bookkeepingError)}`,
          )
          committedWarning = warning
          return {
            ok: true as const,
            rowCount,
            durationMs,
            importId: history.id,
            warning,
          }
        }

        return asideDropWarning
          ? {
              ok: true as const,
              rowCount,
              durationMs,
              importId: history.id,
              warning: asideDropWarning,
            }
          : { ok: true as const, rowCount, durationMs, importId: history.id }
      } catch (error) {
        // Rollback while the advisory lock is still held so a concurrent import cannot interleave.
        if (!restoreCommitted && aside.mapping) {
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
    // Restore already swapped the live table in; later history writes must not mark FAILED.
    if (restoreCommitted) {
      const durationMs = Date.now() - startedAt
      const warning = joinWarnings(
        committedWarning,
        `Import OK, aber Verlaufseintrag konnte nicht auf SUCCESS gesetzt werden: ${errorMessage(error)}`,
      )
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
        // Leave RUNNING rather than FAILED — the live table is already swapped in.
      }
      return {
        ok: true as const,
        rowCount: committedRowCount!,
        durationMs,
        importId: history.id,
        warning,
      }
    }

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
        updatedById: userId ?? null,
      },
    })
    throw new Error(message, { cause: error })
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
