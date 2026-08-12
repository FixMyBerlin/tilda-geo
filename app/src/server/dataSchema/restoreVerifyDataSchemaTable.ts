import {
  dataSchemaTableExists,
  dropTableIfExists,
  getDataSchemaTableRowCount,
  restoreDumpFile,
  restoreTableAside,
} from './dataSchemaDb.server'
import type { AsideRenameMapping } from './pgIdentifier'

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export type RestoreVerifyDeps = {
  restoreDumpFile: (dumpPath: string, table: string) => Promise<void>
  getDataSchemaTableRowCount: (table: string) => Promise<number | null>
  dataSchemaTableExists: (table: string) => Promise<boolean>
  dropTableIfExists: (qualifiedName: string) => Promise<void>
  restoreTableAside: (mapping: AsideRenameMapping) => Promise<void>
}

const defaultDeps = {
  restoreDumpFile,
  getDataSchemaTableRowCount,
  dataSchemaTableExists,
  dropTableIfExists,
  restoreTableAside,
} satisfies RestoreVerifyDeps

export type AsideHolder = { mapping: AsideRenameMapping | null }

/**
 * Restore dump, verify row count, drop aside. On failure of restore/verify, drops the new
 * live table and restores the aside. On success, clears `aside.mapping` so later bookkeeping
 * failures must not roll back a committed restore (orphan aside after a failed drop is OK).
 */
export async function restoreVerifyDataSchemaTable(
  {
    dumpPath,
    table,
    expectedRowCount,
    aside,
  }: {
    dumpPath: string
    table: string
    expectedRowCount: number
    aside: AsideHolder
  },
  deps: RestoreVerifyDeps = defaultDeps,
) {
  try {
    await deps.restoreDumpFile(dumpPath, table)

    const restoredCount = await deps.getDataSchemaTableRowCount(table)
    if (restoredCount !== expectedRowCount) {
      throw new Error(
        `Row count mismatch after restore: expected ${expectedRowCount}, got ${restoredCount}`,
      )
    }

    let asideDropWarning: string | null = null
    if (aside.mapping) {
      try {
        await deps.dropTableIfExists(`data.${aside.mapping.table.to}`)
      } catch (dropAsideError) {
        // Import itself succeeded; orphan aside is recoverable noise.
        asideDropWarning = `Import OK, aber Aside data.${aside.mapping.table.to} konnte nicht gedroppt werden: ${errorMessage(dropAsideError)}`
      }
      // Committed restore — never roll back the live table for later bookkeeping failures.
      aside.mapping = null
    }

    return { rowCount: restoredCount!, asideDropWarning }
  } catch (restoreOrVerifyError) {
    // Do not swallow drop failures — a live table left behind blocks restoreTableAside.
    try {
      if (await deps.dataSchemaTableExists(table)) {
        await deps.dropTableIfExists(`data.${table}`)
      }
    } catch (dropError) {
      throw new Error(
        `Restore/Verify fehlgeschlagen (${errorMessage(restoreOrVerifyError)}); anschließendes DROP der neuen Tabelle ebenfalls fehlgeschlagen (${errorMessage(dropError)}). Manuelle Intervention nötig.`,
        { cause: restoreOrVerifyError },
      )
    }
    if (aside.mapping) {
      try {
        await deps.restoreTableAside(aside.mapping)
        aside.mapping = null
      } catch (rollbackError) {
        throw new Error(
          `Restore/Verify fehlgeschlagen (${errorMessage(restoreOrVerifyError)}); Rollback der Aside-Tabelle fehlgeschlagen — manuelle Intervention nötig: ${errorMessage(rollbackError)}`,
          { cause: restoreOrVerifyError },
        )
      }
    }
    throw restoreOrVerifyError
  }
}
