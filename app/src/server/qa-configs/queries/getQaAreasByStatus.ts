import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { transformEvaluationWithDecisionData } from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'
import { resolver } from '@blitzjs/rpc'
import { QaEvaluationStatus } from '@prisma/client'
import { Ctx } from 'blitz'
import { z } from 'zod'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  userStatus: z.nativeEnum(QaEvaluationStatus).nullable(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configSlug, regionSlug, userStatus }, { session }: Ctx) => {
    const { isAuthorized } = await checkRegionAuthorization(session, regionSlug)
    if (!isAuthorized) {
      return []
    }

    const qaConfig = await db.qaConfig.findFirst({
      where: { slug: configSlug, region: { slug: regionSlug } },
    })

    if (!qaConfig) {
      return []
    }

    // Get the validated table name
    const tableName = getQaTableName(qaConfig.mapTable)

    // Get latest evaluation per areaId (orderBy must start with distinct field), then take 20 most recent by createdAt
    const TAKE_RECENT = 20
    const FETCH_DISTINCT_UP_TO = 500

    const areasWithEvaluationsRaw = await db.qaEvaluation.findMany({
      where: {
        configId: qaConfig.id,
        userStatus: userStatus,
      },
      include: {
        author: {
          select: {
            id: true,
            osmName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ areaId: 'asc' }, { createdAt: 'desc' }],
      take: FETCH_DISTINCT_UP_TO,
      distinct: ['areaId'],
    })

    const areasWithEvaluations = areasWithEvaluationsRaw
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, TAKE_RECENT)

    // Get bbox data for each area from the QA table using PostGIS
    const areaIds = areasWithEvaluations.map((evaluation) => evaluation.areaId)
    const bboxes = await db.$queryRawUnsafe<
      Array<{
        id: string
        min_lng: number
        min_lat: number
        max_lng: number
        max_lat: number
      }>
    >(
      `SELECT
        id,
        public.ST_XMin(public.ST_Envelope(public.ST_Transform(geom, 4326))) as min_lng,
        public.ST_YMin(public.ST_Envelope(public.ST_Transform(geom, 4326))) as min_lat,
        public.ST_XMax(public.ST_Envelope(public.ST_Transform(geom, 4326))) as max_lng,
        public.ST_YMax(public.ST_Envelope(public.ST_Transform(geom, 4326))) as max_lat
      FROM ${tableName}
      WHERE id = ANY($1)`,
      areaIds,
    )

    // Create a map of areaId to bbox coordinates
    const bboxMap = new Map(
      bboxes.map((bbox) => [
        bbox.id,
        [bbox.min_lng, bbox.min_lat, bbox.max_lng, bbox.max_lat] as [
          number,
          number,
          number,
          number,
        ],
      ]),
    )

    // Transform to the expected format
    const result = areasWithEvaluations.map((evaluation) => {
      const bbox = bboxMap.get(evaluation.areaId)
      const transformedEvaluation = transformEvaluationWithDecisionData(evaluation)
      return {
        areaId: evaluation.areaId,
        bbox: bbox || null,
        latestEvaluation: transformedEvaluation,
      }
    })

    return result
  },
)
