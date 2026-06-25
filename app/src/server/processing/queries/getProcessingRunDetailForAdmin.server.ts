import { notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { parseProcessingRunRow } from '../schemas'

export async function getProcessingRunDetailForAdmin(metaId: number, headers: Headers) {
  await requireAdmin(headers)

  const rows = await db.$queryRaw<unknown[]>`
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
    WHERE id = ${metaId}
    LIMIT 1
  `

  const row = rows[0]
  if (!row) throw notFound()

  const parsed = parseProcessingRunRow(row)
  if (!parsed.success) {
    console.warn('[admin/processing] Invalid meta row', { metaId, error: parsed.error })
    throw notFound()
  }

  return parsed.data
}
