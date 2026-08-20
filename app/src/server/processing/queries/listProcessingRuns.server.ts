import db from '@/server/db.server'
import { clampSkipTake } from '@/shared/pagination/clampSkipTake'
import { parseProcessingRunRow, type ProcessingRunRow } from '../schemas'

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

export async function listProcessingRuns(filters: { skip?: number; take?: number } = {}) {
  const { skip, take } = clampSkipTake(filters.skip, filters.take, {
    defaultTake: DEFAULT_TAKE,
    maxTake: MAX_TAKE,
  })

  const [countRows, rows] = await Promise.all([
    db.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint AS count FROM public.meta`,
    db.$queryRaw<ProcessingRunRow[]>`
      SELECT
        id,
        status,
        processing_duration::text AS processing_duration,
        osm_data_from,
        processing_started_at,
        processing_completed_at,
        qa_update_started_at,
        qa_update_completed_at,
        COALESCE(topics, '{}'::jsonb) AS topics,
        COALESCE(afterthoughts, '{}'::jsonb) AS afterthoughts
      FROM public.meta
      ORDER BY id DESC
      LIMIT ${take}
      OFFSET ${skip}
    `,
  ])

  const parsed = rows.flatMap((row) => {
    const result = parseProcessingRunRow(row)
    if (!result.success) {
      console.warn('[processing] Skipping invalid meta row', { row, error: result.error })
      return []
    }
    return [result.data]
  })

  return {
    rows: parsed,
    total: Number(countRows[0]?.count ?? 0),
    skip,
    take,
  }
}
