import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { ProcessingMetaDate, ProcessingMetaDates } from '../schemas'

export default resolver.pipe(
  // resolver.authorize(/* ok */), // Open without Auth
  async ({}) => {
    const [result] = await db.$queryRaw<ProcessingMetaDate[]>`
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
  },
)
