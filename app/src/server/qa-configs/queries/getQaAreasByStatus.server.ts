import type { QaEvaluationStatus, QaSystemStatus } from '@prisma/client'
import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import db from '@/server/db.server'
import {
  isQaListStyleKey,
  QA_LIST_TAKE_RECENT,
  type QaListStyleKey,
} from '@/server/qa-configs/listStyleKeys.const'
import type { QaDecisionDataStored } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import { transformEvaluationWithDecisionData } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  styleKey: z.string().refine(isQaListStyleKey, 'Invalid QaListStyleKey'),
})

function matchesStyle(
  evaluation: { userStatus: QaEvaluationStatus | null; systemStatus: QaSystemStatus },
  styleKey: QaListStyleKey,
) {
  switch (styleKey) {
    case 'user-not-ok-processing':
      return evaluation.userStatus === 'NOT_OK_PROCESSING_ERROR'
    case 'user-not-ok-osm':
      return evaluation.userStatus === 'NOT_OK_DATA_ERROR'
    case 'user-ok-construction':
      return evaluation.userStatus === 'OK_STRUCTURAL_CHANGE'
    case 'user-ok-reference-error':
      return evaluation.userStatus === 'OK_REFERENCE_ERROR'
    case 'user-ok-qa-tooling-error':
      return evaluation.userStatus === 'OK_QA_TOOLING_ERROR'
    case 'user-pending-needs-review':
      return evaluation.userStatus === null && evaluation.systemStatus === 'NEEDS_REVIEW'
    case 'user-pending-problematic':
      return evaluation.userStatus === null && evaluation.systemStatus === 'PROBLEMATIC'
  }
}

function sortKeyAbsoluteChange(decisionData: QaDecisionDataStored | null) {
  if (decisionData?.absoluteChange == null) return 0
  return Math.abs(decisionData.absoluteChange)
}

const FETCH_DISTINCT_UP_TO = 500

export async function getQaAreasByStatus(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)

  const { configSlug, regionSlug, styleKey } = Schema.parse(input)

  const { isAuthorized } = await checkRegionAuthorization(appSession, regionSlug)
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

  const areasWithEvaluationsRaw = await db.qaEvaluation.findMany({
    where: { configId: qaConfig.id },
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

  const parsed = areasWithEvaluationsRaw.map((e) => ({
    evaluation: e,
    decisionData: transformEvaluationWithDecisionData(e).decisionData,
  }))
  const filtered = parsed.filter(({ evaluation }) =>
    matchesStyle(
      { userStatus: evaluation.userStatus, systemStatus: evaluation.systemStatus },
      styleKey as QaListStyleKey,
    ),
  )
  const sorted = filtered.sort((a, b) => {
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
      [bbox.min_lng, bbox.min_lat, bbox.max_lng, bbox.max_lat] as [number, number, number, number],
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
}
