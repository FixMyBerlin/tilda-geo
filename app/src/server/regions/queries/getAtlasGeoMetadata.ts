import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { ProcessingMetaDate, ProcessingMetaDates } from '../schemas'

export default resolver.pipe(
  // resolver.authorize(/* ok */), // Open without Auth
  async ({}) => {
    const [result] = await db.$queryRaw<ProcessingMetaDate[]>`
      SELECT status, processed_at, osm_data_from, processing_started_at
      FROM public.meta
      ORDER BY id DESC
      LIMIT 1
    `

    return ProcessingMetaDates.parse(result)
  },
)
