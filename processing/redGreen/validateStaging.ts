import type { RedGreenConfig } from './config'
import { queryLines, queryOne } from './db'
import { assertPromotableTables, isIntermediateTable, isSkippedTable } from './promotableTables'

type ValidationResult = {
  tables: string[]
}

async function countTableRows(
  config: RedGreenConfig,
  table: string,
  schema: 'staging' | 'primary',
) {
  const db = schema === 'staging' ? config.staging : config.primary
  const nRows = await queryOne(db, `SELECT COUNT(*) FROM public."${table}"`)
  if (nRows === null) {
    return null
  }
  return Number(nRows)
}

async function tableExistsOnPrimary(config: RedGreenConfig, table: string) {
  const exists = await queryOne(
    config.primary,
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table.replaceAll("'", "''")}'`,
  )
  return Number(exists || 0) > 0
}

function assertRowCountWithinTolerance(
  table: string,
  stagingCount: number,
  primaryCount: number,
  tolerance: number,
) {
  if (primaryCount === 0) {
    return
  }
  const delta = Math.abs(stagingCount - primaryCount) / primaryCount
  if (delta > tolerance) {
    throw new Error(
      `Validation failed: public.${table} has ${stagingCount} rows in staging vs ${primaryCount} on primary (${(delta * 100).toFixed(1)}% delta, tolerance ${(tolerance * 100).toFixed(0)}%).`,
    )
  }
}

export async function validateStagingDataset(config: RedGreenConfig): Promise<ValidationResult> {
  let tables =
    config.tablesAllowlist.length > 0
      ? config.tablesAllowlist
      : await queryLines(
          config.staging,
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT LIKE '%\\_diff' ESCAPE '\\' ORDER BY table_name",
        )

  const skippedTables = tables.filter((t) => isSkippedTable(t))
  if (config.tablesAllowlist.length > 0 && skippedTables.length > 0) {
    throw new Error(
      `Validation failed: PROMOTION_TABLES_ALLOWLIST includes skipped table(s) ${skippedTables.join(', ')}`,
    )
  }
  if (skippedTables.length > 0) {
    console.log(`Validation: skipping ${skippedTables.join(', ')} (PROMOTION_TABLE_SKIPLIST)`)
  }
  tables = tables.filter((t) => !isSkippedTable(t))

  if (tables.length === 0) {
    throw new Error('Validation failed: no promotable public tables found in staging DB.')
  }

  assertPromotableTables(tables)

  const metaRows = await countTableRows(config, 'meta', 'staging')
  if (metaRows === null || metaRows <= 0) {
    throw new Error('Validation failed: public.meta has no rows in staging DB.')
  }

  for (const table of tables) {
    const stagingCount = await countTableRows(config, table, 'staging')
    if (stagingCount === null) {
      throw new Error(`Validation failed: unable to count rows for public.${table}`)
    }

    if (stagingCount === 0 && !isIntermediateTable(table)) {
      throw new Error(`Validation failed: public.${table} has zero rows in staging DB.`)
    }

    if (isIntermediateTable(table)) {
      continue
    }

    if (!(await tableExistsOnPrimary(config, table))) {
      console.log(
        `Validation: skipping row-count comparison for public.${table} (not on primary yet)`,
      )
      continue
    }

    const primaryCount = await countTableRows(config, table, 'primary')
    if (primaryCount === null) {
      throw new Error(`Validation failed: unable to count rows for public.${table} on primary`)
    }

    assertRowCountWithinTolerance(table, stagingCount, primaryCount, config.rowCountTolerance)
  }

  return { tables }
}
