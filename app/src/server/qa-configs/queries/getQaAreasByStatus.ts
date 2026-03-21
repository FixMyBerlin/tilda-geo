import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import {
  isQaListStyleKey,
  QA_LIST_TAKE_RECENT,
  type QaListStyleKey,
} from '@/src/server/qa-configs/listStyleKeys.const'
import { QA_LIST_STYLE_WHERE } from '@/src/server/qa-configs/qaStyleFilter.const'
import type { QaDecisionDataStored } from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'
import { transformEvaluationWithDecisionData } from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'
import { resolver } from '@blitzjs/rpc'
import type { Ctx } from 'blitz'
import { z } from 'zod'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  styleKey: z.string(),
})

const FETCH_SAFETY_LIMIT = 2000

function sortKeyAbsoluteChange(decisionData: QaDecisionDataStored | null) {
  if (decisionData?.absoluteChange == null) return 0
  return Math.abs(decisionData.absoluteChange)
}

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configSlug, regionSlug, styleKey: styleKeyInput }, { session }: Ctx) => {
    if (!isQaListStyleKey(styleKeyInput)) {
      return []
    }
    const styleKey = styleKeyInput as QaListStyleKey

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

    const tableName = getQaTableName(qaConfig.mapTable)

    // Filter by style in DB (same criteria as map) so list and map stay in sync. orderBy must start with areaId for distinct.
    const areasWithEvaluationsRaw = await db.qaEvaluation.findMany({
      where: { configId: qaConfig.id, ...QA_LIST_STYLE_WHERE[styleKey] },
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
      take: FETCH_SAFETY_LIMIT,
      distinct: ['areaId'],
    })

    // Sort by largest absolute diff, take TAKE_RECENT
    const parsed = areasWithEvaluationsRaw.map((e) => ({
      evaluation: e,
      decisionData: transformEvaluationWithDecisionData(e).decisionData,
    }))
    const sorted = parsed.sort((a, b) => {
      const diffA = sortKeyAbsoluteChange(a.decisionData)
      const diffB = sortKeyAbsoluteChange(b.decisionData)
      return diffB - diffA
    })
    const areasWithEvaluations = sorted
      .slice(0, QA_LIST_TAKE_RECENT)
      .map(({ evaluation }) => evaluation)

    const areaIds = areasWithEvaluations.map((e) => e.areaId)
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
