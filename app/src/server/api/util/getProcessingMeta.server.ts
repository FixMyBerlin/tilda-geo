import { geoDataClient } from '@/server/prisma-client.server'
import type { ProcessingMetaDate } from '@/server/regions/schemas'
import { ProcessingMetaDates } from '@/server/regions/schemas'

export async function getProcessingMeta() {
  const [result] = await geoDataClient.$queryRaw<ProcessingMetaDate[]>`
    SELECT
      status,
      osm_data_from,
      processing_started_at,
      processing_completed_at,
      qa_update_started_at,
      qa_update_completed_at,
      statistics_started_at,
      statistics_completed_at
    FROM public.meta
    ORDER BY id DESC
    LIMIT 1
  `
  return ProcessingMetaDates.parse(result)
}
