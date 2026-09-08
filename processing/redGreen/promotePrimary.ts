import type { RedGreenConfig } from './config'
import { executeSql, queryOne } from './db'
import { assertPromotableTables } from './promotableTables'

function qIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`
}

export async function promoteStagingIntoPrimary(config: RedGreenConfig, tables: string[]) {
  assertPromotableTables(tables)

  const fdwServer = `geo_stage_server_${config.runId}`

  await executeSql(config.primary, 'CREATE EXTENSION IF NOT EXISTS postgres_fdw')
  await executeSql(config.primary, 'CREATE SCHEMA IF NOT EXISTS geo_stage_import')
  await executeSql(config.primary, 'CREATE SCHEMA IF NOT EXISTS geo_shadow')
  await executeSql(config.primary, 'CREATE SCHEMA IF NOT EXISTS geo_prev')

  await executeSql(config.primary, `DROP SERVER IF EXISTS ${qIdent(fdwServer)} CASCADE`)
  await executeSql(
    config.primary,
    `CREATE SERVER ${qIdent(fdwServer)} FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '${config.staging.host}', port '${config.staging.port}', dbname '${config.staging.database}')`,
  )
  await executeSql(
    config.primary,
    `CREATE USER MAPPING FOR CURRENT_USER SERVER ${qIdent(fdwServer)} OPTIONS (user '${config.staging.username}', password '${config.staging.password}')`,
  )

  await executeSql(config.primary, 'DROP SCHEMA IF EXISTS geo_stage_import CASCADE')
  await executeSql(config.primary, 'CREATE SCHEMA geo_stage_import')

  const list = tables.map(qIdent).join(', ')
  await executeSql(
    config.primary,
    `IMPORT FOREIGN SCHEMA public LIMIT TO (${list}) FROM SERVER ${qIdent(fdwServer)} INTO geo_stage_import`,
  )

  for (const table of tables) {
    const ident = qIdent(table)
    const exists = await queryOne(
      config.primary,
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table.replaceAll("'", "''")}'`,
    )
    const publicExists = Number(exists || 0) > 0

    await executeSql(config.primary, `DROP TABLE IF EXISTS geo_shadow.${ident} CASCADE`)

    if (publicExists) {
      await executeSql(
        config.primary,
        `CREATE TABLE geo_shadow.${ident} (LIKE public.${ident} INCLUDING ALL)`,
      )
      await executeSql(
        config.primary,
        `INSERT INTO geo_shadow.${ident} SELECT * FROM geo_stage_import.${ident}`,
      )
    } else {
      await executeSql(
        config.primary,
        `CREATE TABLE geo_shadow.${ident} AS SELECT * FROM geo_stage_import.${ident} WITH NO DATA`,
      )
      await executeSql(
        config.primary,
        `INSERT INTO geo_shadow.${ident} SELECT * FROM geo_stage_import.${ident}`,
      )
    }
  }

  const swapStatements = tables.flatMap((table) => {
    const ident = qIdent(table)
    return [
      `DROP TABLE IF EXISTS geo_prev.${ident} CASCADE`,
      `ALTER TABLE IF EXISTS public.${ident} SET SCHEMA geo_prev`,
      `ALTER TABLE geo_shadow.${ident} SET SCHEMA public`,
    ]
  })

  await executeSql(config.primary, `BEGIN; ${swapStatements.join('; ')}; COMMIT;`)

  // Cleanup is after the swap: a failure here must not hide that promotion succeeded
  // (callers only treat the returned table list as committed). Leftovers: docs
  // "Recovering from a crashed promotion".
  try {
    await executeSql(config.primary, 'DROP SCHEMA IF EXISTS geo_stage_import CASCADE')
  } catch (cleanupError) {
    console.warn(
      '[WARN] Post-swap FDW cleanup failed; leftovers can be dropped manually (see docs: Recovering from a crashed promotion).',
      cleanupError,
    )
  }
  try {
    await executeSql(config.primary, `DROP SERVER IF EXISTS ${qIdent(fdwServer)} CASCADE`)
  } catch (cleanupError) {
    console.warn(
      '[WARN] Post-swap FDW cleanup failed; leftovers can be dropped manually (see docs: Recovering from a crashed promotion).',
      cleanupError,
    )
  }

  return tables
}
