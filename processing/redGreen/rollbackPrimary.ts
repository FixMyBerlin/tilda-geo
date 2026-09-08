import type { RedGreenConfig } from './config'
import { executeSql } from './db'

function qIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`
}

export async function rollbackPrimary(config: RedGreenConfig, tables: string[]) {
  const rollbackStatements = tables.flatMap((table) => {
    const ident = qIdent(table)
    return [
      `DROP TABLE IF EXISTS public.${ident} CASCADE`,
      `ALTER TABLE IF EXISTS geo_prev.${ident} SET SCHEMA public`,
    ]
  })
  await executeSql(config.primary, `BEGIN; ${rollbackStatements.join('; ')}; COMMIT;`)
}
