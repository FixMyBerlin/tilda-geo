import { z } from 'zod'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import {
  QA_MAP_DEFAULT_SQL_PREDICATE,
  qaMapPayloadAppliesDefault,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaMapDefaultStatus'
import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { qaSearchSqlPredicate } from '@/server/qa-configs/qaAreaListPredicates'

const Schema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  userIds: z.array(z.string()).optional(),
  search: z.string().optional(),
})

export type QaMapData = {
  areaId: string
  systemStatus: string | null // Letter representing system status (G, N, P)
  userStatus: string | null // Letter representing user status (S, R, D, P, QA)
}

type MapRow = {
  areaId: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
}

export async function getQaDataForMap(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)
  const { configSlug, regionSlug, userIds, search } = Schema.parse(input)

  const authResult = await canAccessMemberModeForRegion(appSession, regionSlug)
  if (!authResult.isAuthorized) {
    return []
  }

  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })
  if (!qaConfig) {
    return []
  }

  const params: unknown[] = [qaConfig.id]
  let userFilterSql = 'TRUE'
  if (userIds && userIds.length > 0) {
    params.push(userIds)
    userFilterSql = `e."userId" = ANY($${params.length}::text[])`
  }

  const searchPredicate = qaSearchSqlPredicate(search, params.length + 1)
  params.push(...searchPredicate.params)

  // Only the unfiltered payload may omit Gut rows, because only then does the client backfill
  // them with QA_MAP_DEFAULT_STATUS. A search or user filter must return its matches in full,
  // including Gut ones — same rule on both sides, so the two cannot drift apart.
  const omitDefaultSql = qaMapPayloadAppliesDefault({ search, userIds })
    ? `NOT (${QA_MAP_DEFAULT_SQL_PREDICATE})`
    : 'TRUE'

  const sql = `
WITH latest AS (
  SELECT DISTINCT ON (e."areaId")
         e."areaId", e."systemStatus", e."userStatus", e.body, e."userId"
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND (${userFilterSql})
  ORDER BY e."areaId", e."createdAt" DESC, e.id DESC
)
SELECT l."areaId", l."systemStatus", l."userStatus"
FROM latest l
LEFT JOIN prisma."User" u ON u.id = l."userId"
WHERE ${searchPredicate.sql}
  AND ${omitDefaultSql}
`

  const rows = await db.$queryRawUnsafe<MapRow[]>(sql, ...params)

  return rows.map((row) => {
    const userStatusLetter = row.userStatus ? USER_STATUS_TO_LETTER[row.userStatus] : null
    return {
      areaId: row.areaId,
      systemStatus: SYSTEM_STATUS_TO_LETTER[row.systemStatus],
      userStatus: userStatusLetter,
    } satisfies QaMapData
  })
}
