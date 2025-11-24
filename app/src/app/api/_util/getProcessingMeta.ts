import { geoDataClient } from '@/src/server/prisma-client'
import { ProcessingMetaDate, ProcessingMetaDates } from '@/src/server/regions/schemas'

export async function getProcessingMeta() {
  const [result] = await geoDataClient.$queryRaw<ProcessingMetaDate[]>`
    SELECT status, processed_at, osm_data_from, processing_started_at
    FROM public.meta
    ORDER BY id DESC
    LIMIT 1
  `
  return ProcessingMetaDates.parse(result)
}
