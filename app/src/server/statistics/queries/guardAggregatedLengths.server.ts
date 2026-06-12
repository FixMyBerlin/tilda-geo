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
      '[dev tip] Run processing to completion (afterthoughts populate aggregated_lengths),',
      'or execute processing/steps/afterthoughts/sql/aggregate_lengths.sql against the geo DB.',
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
