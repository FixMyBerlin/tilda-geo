import { geoDataClient } from '@/server/prisma-client.server'
import type { ProcessingMetaDate } from '@/server/regions/processingMetaDates'
import { ProcessingMetaDates } from '@/server/regions/processingMetaDates'

export async function getProcessingMeta() {
  const [result] = await geoDataClient.$queryRaw<ProcessingMetaDate[]>`
    SELECT
      status,
      osm_data_from,
      processing_started_at,
      processing_completed_at,
      qa_update_started_at,
      qa_update_completed_at
    FROM public.meta
    ORDER BY id DESC
    LIMIT 1
  `

  if (!result) return null

  return ProcessingMetaDates.parse(result)
}

export async function getProcessingOsmDataFromIso() {
  return (await getProcessingMeta())?.osm_data_from?.toISOString() ?? new Date().toISOString()
}
