import * as p from '@clack/prompts'
import { dataSchemaRootDir } from '@/server/dataSchema/dataSchemaLocalPaths'
import { dataSchemaIdentifierRegex } from '@/server/dataSchema/dataSchemaSpec.schema'
import { listFilesByEnding } from './listFiles'

export async function listLocalTablesWithSpec() {
  const specPaths = await listFilesByEnding(dataSchemaRootDir(), ['spec.yaml'], '*/spec.yaml')
  const tables: string[] = []
  for (const match of specPaths) {
    const table = match.split('/')[0] ?? ''
    if (dataSchemaIdentifierRegex.test(table)) tables.push(table)
  }
  return tables.sort()
}

export async function resolveRequiredTable(explicitTable: string | undefined, action: string) {
  if (explicitTable) return explicitTable

  const tables = await listLocalTablesWithSpec()
  if (tables.length === 0) {
    throw new Error('No local spec.yaml found under data-schema/')
  }
  if (tables.length === 1) {
    const table = tables[0]!
    p.log.info(`Using ${table} (only local spec)`)
    return table
  }

  if (!process.stdin.isTTY) {
    const list = tables.map((table) => `  ${table}`).join('\n')
    throw new Error(
      `--table is required. Local specs:\n${list}\nPass --table <name> or re-run on a TTY to pick.`,
    )
  }

  const selected = await p.select({
    message: `Which table to ${action}?`,
    options: tables.map((table) => ({ value: table, label: table })),
  })
  if (p.isCancel(selected)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  return selected
}
