import db from '@/server/db.server'
import { parseProcessingRunRow, type ProcessingRunRow } from '../schemas'

export async function getProcessingRun(id?: number) {
  const rows =
    id === undefined
      ? await db.$queryRaw<ProcessingRunRow[]>`
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
          LIMIT 1
        `
      : await db.$queryRaw<ProcessingRunRow[]>`
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
          WHERE id = ${id}
          LIMIT 1
        `

  const row = rows[0]
  if (!row) {
    throw new Error(
      id === undefined ? 'No processing runs found' : `Processing run ${id} not found`,
    )
  }

  const parsed = parseProcessingRunRow(row)
  if (!parsed.success) {
    console.warn('[processing] Invalid meta row', { id: id ?? row.id, error: parsed.error })
    throw new Error(`Processing run ${id ?? row.id} has invalid meta data`)
  }

  return parsed.data
}
