import db from '@/server/db.server'
import { paginate } from '@/server/utils/paginate.server'
import { parseProcessingRunRow, type ProcessingRunRow } from '../schemas'

export async function listProcessingRuns(
  filters: { skip?: number; take?: number } = {},
  { fallbackToLastPage = false } = {},
) {
  return paginate({
    skip: filters.skip,
    take: filters.take,
    fallbackToLastPage,
    count: async () => {
      const countRows = await db.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count FROM public.meta
      `
      return Number(countRows[0]?.count ?? 0)
    },
    query: async ({ skip, take }) => {
      const rows = await db.$queryRaw<ProcessingRunRow[]>`
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
      `

      return rows.flatMap((row) => {
        const result = parseProcessingRunRow(row)
        if (!result.success) {
          console.warn('[processing] Skipping invalid meta row', { row, error: result.error })
          return []
        }
        return [result.data]
      })
    },
  })
}
