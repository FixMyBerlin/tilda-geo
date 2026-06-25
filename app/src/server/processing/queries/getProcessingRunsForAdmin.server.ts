import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { parseProcessingRunRow, type ProcessingRunRow } from '../schemas'

const RUNS_LIMIT = 50

export async function getProcessingRunsForAdmin(headers: Headers) {
  await requireAdmin(headers)

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
      statistics_started_at,
      statistics_completed_at,
      COALESCE(topics, '{}'::jsonb) AS topics
    FROM public.meta
    ORDER BY id DESC
    LIMIT ${RUNS_LIMIT}
  `

  return rows.flatMap((row) => {
    const parsed = parseProcessingRunRow(row)
    if (!parsed.success) {
      console.warn('[admin/processing] Skipping invalid meta row', { row, error: parsed.error })
      return []
    }
    return [parsed.data]
  })
}
