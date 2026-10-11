import { z } from 'zod'
import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { parseQaConfigIndicators } from '@/server/qa-configs/utils/parseQaConfigIndicators'
import {
  encodeQaStatusLetters,
  isQaMapDefaultLetters,
  type QaIndicatorStatusPair,
} from '@/shared/qaIndicatorStatus'
import { qaMapPayloadAppliesDefault } from '@/shared/qaMapDefaultStatus'
import { qaSearchSqlPredicate } from './qaSearchSql'

const Schema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  userIds: z.array(z.string()).optional(),
  search: z.string().optional(),
})

/**
 * One entry per cell, with one letter per indicator in `QaConfig.indicators` order.
 * Docs: docs/QA-Map-Status-Payload.md.
 */
type QaMapData = {
  areaId: string
  /** G / N / P / T per indicator. */
  sys: string
  /** S / R / D / P / Q per indicator, `.` where nobody decided. */
  usr: string
}

type MapRow = {
  areaId: string
  indicatorKey: string
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
  const indicators = parseQaConfigIndicators(qaConfig.indicators)

  const params: unknown[] = [qaConfig.id]
  let userFilterSql = 'TRUE'
  if (userIds && userIds.length > 0) {
    params.push(userIds)
    userFilterSql = `e."userId" = ANY($${params.length}::text[])`
  }

  const searchPredicate = qaSearchSqlPredicate(search, params.length + 1)
  params.push(...searchPredicate.params)

  // Only the unfiltered payload may omit all-Gut cells, because only then does the client backfill
  // them with the default letters. A search or user filter must return its matches in full,
  // including the Gut ones — same rule on both sides, so the two cannot drift apart.
  const applyDefault = qaMapPayloadAppliesDefault({ search, userIds })

  // `isQaMapDefaultLetters` below stays the authority for the omit. This clause only keeps the
  // payload small (Berlin bikelanes: 35k cells × 6 indicators) by not shipping cells whose every
  // latest row is already the default — those can only encode to all-G / all-`.`.
  const omitDefaultSql = applyDefault
    ? `f."areaId" IN (SELECT "areaId" FROM filtered WHERE NOT ("systemStatus" = 'GOOD' AND "userStatus" IS NULL))`
    : 'TRUE'

  const sql = `
WITH latest AS (
  SELECT DISTINCT ON (e."areaId", e."indicatorKey")
         e."areaId", e."indicatorKey", e."systemStatus", e."userStatus", e.body, e."userId"
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND (${userFilterSql})
  ORDER BY e."areaId", e."indicatorKey", e."createdAt" DESC, e.id DESC
),
filtered AS (
  -- A search matches per indicator row, so a cell can come back with only the rows that matched;
  -- the indicators that did not match fall back to the default below, as they do for the map.
  SELECT l."areaId", l."indicatorKey", l."systemStatus", l."userStatus"
  FROM latest l
  LEFT JOIN prisma."User" u ON u.id = l."userId"
  WHERE ${searchPredicate.sql}
)
SELECT f."areaId", f."indicatorKey", f."systemStatus", f."userStatus"
FROM filtered f
WHERE ${omitDefaultSql}
`

  const rows = await db.$queryRawUnsafe<MapRow[]>(sql, ...params)

  const byAreaId = new Map<string, Map<string, MapRow>>()
  for (const row of rows) {
    const areaRows = byAreaId.get(row.areaId) ?? new Map<string, MapRow>()
    areaRows.set(row.indicatorKey, row)
    byAreaId.set(row.areaId, areaRows)
  }

  const data: QaMapData[] = []
  for (const [areaId, areaRows] of byAreaId) {
    // An indicator without an evaluation row is GOOD without a user decision — the same default the
    // client assumes for an omitted cell, so the letter string always has one char per indicator.
    const pairs = indicators.map(
      (indicator) =>
        ({
          systemStatus: areaRows.get(indicator.key)?.systemStatus ?? 'GOOD',
          userStatus: areaRows.get(indicator.key)?.userStatus ?? null,
        }) satisfies QaIndicatorStatusPair,
    )
    const { sys, usr } = encodeQaStatusLetters(pairs)
    if (applyDefault && isQaMapDefaultLetters(sys, usr)) continue
    data.push({ areaId, sys, usr })
  }

  return data
}
