import { z } from 'zod'
import {
  QA_STATUS_OPTIONS,
  QA_STATUS_SELECT_ALL,
  type QaStatusParam,
  zodQaParamStatus,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import type { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@/prisma/generated/client'
import { getMemberSession, type MemberCaller } from '@/server/auth/memberCaller.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import {
  QA_AREA_LIST_LIMIT_ALL,
  QA_AREA_LIST_LIMIT_VIEW,
} from '@/server/qa-configs/qaAreaList.const'
import { parseQaConfigIndicators } from '@/server/qa-configs/utils/parseQaConfigIndicators'
import { worstQaIndicatorStatus } from '@/shared/qaIndicatorStatus'
import { getQaTableName } from '../utils/getQaTableName'
import { qaSearchSqlPredicate, type SqlFragment } from './qaSearchSql'

/** Shared with the `getQaAreaListFn` validator so the RPC boundary and the query cannot drift. */
export const QaAreaListSchema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  // Strict on the wire: an unknown status used to fall through to "no filter", silently listing
  // every area. The URL schema tolerates stale values, so a real client never sends one.
  status: zodQaParamStatus.optional(),
  userIds: z.array(z.string()).optional(),
  // Selected indicator keys; absent or empty = every indicator of the config.
  indicatorKeys: z.array(z.string()).optional(),
  search: z.string().optional(),
  // WGS84 [minLng, minLat, maxLng, maxLat]; present = extent 'view', absent = extent 'all'
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
})

export type QaAreaListItem = {
  areaId: string
  bbox: [number, number, number, number]
  center: [number, number]
  /** Of the worst selected indicator — the same cell color the map paints. */
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  indicatorKey: string
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  commentCount: number
}

export type QaAreaListResult = { items: QaAreaListItem[]; totalCount: number; limit: number }

type AreaRow = {
  areaId: string
  comment_count: bigint | number | null
  min_lng: number
  min_lat: number
  max_lng: number
  max_lat: number
  center_lng: number
  center_lat: number
  total_count: bigint | number | null
}

type IndicatorRow = {
  areaId: string
  indicatorKey: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
}

const emptyResult = (limit: number) =>
  ({ items: [], totalCount: 0, limit }) satisfies QaAreaListResult

/**
 * Status filter on the latest-per-(area, indicator) CTE alias `l`. `'all'` / undefined → no
 * constraint. The caller wraps this in `bool_or(...)` per area: a cell matches when ANY selected
 * indicator matches.
 */
export function qaStatusSqlPredicate(status: QaStatusParam | undefined, nextParamIndex: number) {
  if (status === undefined || status === QA_STATUS_SELECT_ALL) {
    return { sql: 'TRUE', params: [] } satisfies SqlFragment
  }
  const option = QA_STATUS_OPTIONS.find((entry) => entry.key === status)
  // Unreachable: `zodQaParamStatus` is built from these same options. Fail loudly rather than
  // falling back to no constraint, which would answer a status filter with every area.
  if (!option) {
    throw new Error(`Unknown QA status key: ${status}`)
  }

  const clauses: string[] = []
  const params: unknown[] = []
  let index = nextParamIndex

  if (option.userStatus === null) {
    clauses.push('l."userStatus" IS NULL')
  } else {
    clauses.push(`l."userStatus"::text = $${index}`)
    params.push(option.userStatus)
    index += 1
  }

  if (option.systemStatus !== null) {
    clauses.push(`l."systemStatus"::text = $${index}`)
    params.push(option.systemStatus)
  }

  return { sql: clauses.join(' AND '), params } satisfies SqlFragment
}

/**
 * Restrict the latest-row CTE to the selected indicators. An empty / absent selection means "all",
 * the same convention the URL param uses.
 */
export function qaIndicatorSqlPredicate(
  indicatorKeys: string[] | undefined,
  nextParamIndex: number,
) {
  if (!indicatorKeys || indicatorKeys.length === 0) {
    return { sql: 'TRUE', params: [] } satisfies SqlFragment
  }
  return {
    sql: `l."indicatorKey" = ANY($${nextParamIndex}::text[])`,
    params: [indicatorKeys],
  } satisfies SqlFragment
}

export async function getQaAreaList(input: z.infer<typeof QaAreaListSchema>, caller: MemberCaller) {
  const appSession = await getMemberSession(caller)
  const { configSlug, regionSlug, status, userIds, indicatorKeys, search, bbox } =
    QaAreaListSchema.parse(input)
  const hasBbox = bbox !== undefined
  const limit = hasBbox ? QA_AREA_LIST_LIMIT_VIEW : QA_AREA_LIST_LIMIT_ALL

  const { isAuthorized } = await canAccessMemberModeForRegion(appSession, regionSlug)
  if (!isAuthorized) {
    return emptyResult(limit)
  }

  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })
  if (!qaConfig) {
    return emptyResult(limit)
  }
  const indicators = parseQaConfigIndicators(qaConfig.indicators)
  const selectedKeys =
    indicatorKeys && indicatorKeys.length > 0
      ? indicators.filter((indicator) => indicatorKeys.includes(indicator.key))
      : indicators
  if (selectedKeys.length === 0) {
    return emptyResult(limit)
  }
  const indicatorOrder = new Map(selectedKeys.map((indicator, index) => [indicator.key, index]))

  const tableName = getQaTableName(qaConfig.mapTable)
  const params: unknown[] = [qaConfig.id]
  let userFilterSql = 'TRUE'
  if (userIds && userIds.length > 0) {
    params.push(userIds)
    userFilterSql = `e."userId" = ANY($${params.length}::text[])`
  }

  const indicatorPredicate = qaIndicatorSqlPredicate(
    selectedKeys.map((indicator) => indicator.key),
    params.length + 1,
  )
  params.push(...indicatorPredicate.params)

  const statusPredicate = qaStatusSqlPredicate(status, params.length + 1)
  params.push(...statusPredicate.params)

  const searchPredicate = qaSearchSqlPredicate(search, params.length + 1)
  params.push(...searchPredicate.params)

  let bboxFilterSql = 'TRUE'
  if (hasBbox) {
    params.push(bbox[0], bbox[1], bbox[2], bbox[3])
    const envelopeIndex = params.length - 3
    bboxFilterSql = `a.geom && public.ST_Transform(public.ST_MakeEnvelope($${envelopeIndex}, $${envelopeIndex + 1}, $${envelopeIndex + 2}, $${envelopeIndex + 3}, 4326), 3857)`
  }

  params.push(limit)
  const limitIndex = params.length

  // `latest` is one row per (area, indicator); `matched` folds it back to one row per area, so the
  // status filter is an ANY-of-the-selected-indicators match and the sort key is the largest
  // difference of the selected indicators (all in the dataset unit).
  const areaSql = `
WITH latest AS (
  SELECT DISTINCT ON (e."areaId", e."indicatorKey")
         e."areaId", e."indicatorKey", e."systemStatus", e."userStatus", e."decisionData",
         e."userId", e.body
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND (${userFilterSql})
  ORDER BY e."areaId", e."indicatorKey", e."createdAt" DESC, e.id DESC
),
matched AS (
  SELECT l."areaId",
         bool_or(${statusPredicate.sql}) AS status_match,
         bool_or(${searchPredicate.sql}) AS search_match,
         max((l."decisionData"->>'difference')::numeric) AS sort_difference
  FROM latest l
  LEFT JOIN prisma."User" u ON u.id = l."userId"
  WHERE ${indicatorPredicate.sql}
  GROUP BY l."areaId"
)
SELECT m."areaId",
       COALESCE(c.comment_count, 0) AS comment_count,
       public.ST_XMin(g.env) AS min_lng, public.ST_YMin(g.env) AS min_lat,
       public.ST_XMax(g.env) AS max_lng, public.ST_YMax(g.env) AS max_lat,
       public.ST_X(g.center) AS center_lng, public.ST_Y(g.center) AS center_lat,
       count(*) OVER () AS total_count
FROM matched m
LEFT JOIN (
  SELECT e."areaId", count(*)::int AS comment_count
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND e.body IS NOT NULL
    AND btrim(e.body) <> ''
  GROUP BY e."areaId"
) c ON c."areaId" = m."areaId"
-- Inner join guarantees geometry (orphans without a map-table area are
-- reported on the admin QA config page instead).
INNER JOIN ${tableName} a ON a.id = m."areaId"
CROSS JOIN LATERAL (
  SELECT
    -- Envelope first: 5 vertices instead of the full ring. Exact here because
    -- EPSG:3857 ↔ EPSG:4326 is per-axis monotonic, so envelope-then-transform
    -- equals transform-then-envelope.
    public.ST_Transform(public.ST_Envelope(a.geom), 4326) AS env,
    -- Areal geometry is guaranteed: processing types the map tables
    -- geometry(MultiPolygon, 3857) and never inserts empty geometry.
    public.ST_Transform(public.ST_PointOnSurface(a.geom), 4326) AS center
) g
WHERE m.status_match
  AND m.search_match
  AND ${bboxFilterSql}
ORDER BY m.sort_difference DESC NULLS LAST, m."areaId" ASC
LIMIT $${limitIndex}
`

  const areaRows = await db.$queryRawUnsafe<AreaRow[]>(areaSql, ...params)
  const totalCount = areaRows[0] ? Number(areaRows[0].total_count ?? 0) : 0
  if (areaRows.length === 0) {
    return emptyResult(limit)
  }

  // Second query, not one per cell: the latest row of every selected indicator for the page of
  // areas we are about to render, so `worstQaIndicatorStatus` can pick the cell's status in TS.
  const indicatorRows = await db.$queryRawUnsafe<IndicatorRow[]>(
    `
      SELECT DISTINCT ON (e."areaId", e."indicatorKey")
             e."areaId", e."indicatorKey", e."systemStatus", e."userStatus", e."createdAt",
             e."evaluatorType",
             u."osmName" AS "authorOsmName", u."firstName" AS "authorFirstName",
             u."lastName" AS "authorLastName"
      FROM prisma."QaEvaluation" e
      LEFT JOIN prisma."User" u ON u.id = e."userId"
      WHERE e."configId" = $1
        AND e."areaId" = ANY($2::text[])
        AND e."indicatorKey" = ANY($3::text[])
        AND (${userIds && userIds.length > 0 ? 'e."userId" = ANY($4::text[])' : 'TRUE'})
      ORDER BY e."areaId", e."indicatorKey", e."createdAt" DESC, e.id DESC
    `,
    qaConfig.id,
    areaRows.map((row) => row.areaId),
    selectedKeys.map((indicator) => indicator.key),
    ...(userIds && userIds.length > 0 ? [userIds] : []),
  )

  const byAreaId = new Map<string, IndicatorRow[]>()
  for (const row of indicatorRows) {
    const group = byAreaId.get(row.areaId) ?? []
    group.push(row)
    byAreaId.set(row.areaId, group)
  }

  const items = areaRows.flatMap((row) => {
    const group = (byAreaId.get(row.areaId) ?? []).sort(
      (a, b) =>
        (indicatorOrder.get(a.indicatorKey) ?? 0) - (indicatorOrder.get(b.indicatorKey) ?? 0),
    )
    // Ties keep the first indicator, i.e. the config order — same rule as the map.
    const worst = worstQaIndicatorStatus(group)
    if (!worst) return []

    return [
      {
        areaId: row.areaId,
        bbox: [
          Number(row.min_lng),
          Number(row.min_lat),
          Number(row.max_lng),
          Number(row.max_lat),
        ] satisfies [number, number, number, number],
        center: [Number(row.center_lng), Number(row.center_lat)] satisfies [number, number],
        systemStatus: worst.systemStatus,
        userStatus: worst.userStatus,
        indicatorKey: worst.indicatorKey,
        createdAt: worst.createdAt,
        evaluatorType: worst.evaluatorType,
        authorOsmName: worst.authorOsmName,
        authorFirstName: worst.authorFirstName,
        authorLastName: worst.authorLastName,
        commentCount: Number(row.comment_count ?? 0),
      } satisfies QaAreaListItem,
    ]
  })

  return { items, totalCount, limit } satisfies QaAreaListResult
}
