import { styleText } from 'node:util'
import { geoDataClient } from '@/server/prisma-client.server'

const aggregatedLengthsTable = 'public.aggregated_lengths'
let hasLoggedMissingTable = false

const logMissingTableHint = () => {
  if (hasLoggedMissingTable) return
  hasLoggedMissingTable = true

  process.stderr.write(
    `${styleText(
      ['bold', 'red'],
      `[stats] Missing table "${aggregatedLengthsTable}". Statistics endpoints return empty payloads.`,
    )}\n`,
  )

  if (process.env.NODE_ENV !== 'production') {
    const tip = [
      '[dev tip] Open /admin, then click:',
      '1) "SQL-Funktionen registrieren"',
      '2) "Statistik / Analysis"',
      'After both background jobs are done, restart the dev server (`bun run dev`).',
    ].join('\n')
    process.stderr.write(`${styleText(['bold', 'yellow'], tip)}\n`)
  }
}

export async function hasAggregatedLengthsTable() {
  const [result] = await geoDataClient.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.aggregated_lengths') IS NOT NULL as "exists";`

  if (result?.exists) return true
  logMissingTableHint()
  return false
}
