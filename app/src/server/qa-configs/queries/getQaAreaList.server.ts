import { z } from 'zod'
import { zodQaParamStatus } from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import type { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@/prisma/generated/client'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import {
  QA_AREA_LIST_LIMIT_ALL,
  QA_AREA_LIST_LIMIT_VIEW,
} from '@/server/qa-configs/qaAreaList.const'
import {
  QA_ABSOLUTE_CHANGE_SORT_SQL,
  qaSearchSqlPredicate,
  qaStatusSqlPredicate,
} from '@/server/qa-configs/qaAreaListPredicates'
import { getQaTableName } from '../utils/getQaTableName'

/** Shared with the `getQaAreaListFn` validator so the RPC boundary and the query cannot drift. */
export const QaAreaListSchema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  // Strict on the wire: an unknown status used to fall through to "no filter", silently listing
  // every area. The URL schema tolerates stale values, so a real client never sends one.
  status: zodQaParamStatus.optional(),
  userIds: z.array(z.string()).optional(),
  search: z.string().optional(),
  // WGS84 [minLng, minLat, maxLng, maxLat]; present = extent 'view', absent = extent 'all'
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
})

export type QaAreaListItem = {
  areaId: string
  bbox: [number, number, number, number]
  center: [number, number]
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  commentCount: number
}

export type QaAreaListResult = { items: QaAreaListItem[]; totalCount: number; limit: number }

type ListRow = {
  areaId: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  comment_count: bigint | number | null
  min_lng: number
  min_lat: number
  max_lng: number
  max_lat: number
  center_lng: number
  center_lat: number
  total_count: bigint | number | null
}

const emptyResult = (limit: number) =>
  ({ items: [], totalCount: 0, limit }) satisfies QaAreaListResult

export async function getQaAreaList(input: z.infer<typeof QaAreaListSchema>, headers: Headers) {
  const appSession = await getAppSession(headers)
  const { configSlug, regionSlug, status, userIds, search, bbox } = QaAreaListSchema.parse(input)
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

  const tableName = getQaTableName(qaConfig.mapTable)
  const params: unknown[] = [qaConfig.id]
  let userFilterSql = 'TRUE'
  if (userIds && userIds.length > 0) {
    params.push(userIds)
    userFilterSql = `e."userId" = ANY($${params.length}::text[])`
  }

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

  const sql = `
WITH latest AS (
  SELECT DISTINCT ON (e."areaId")
         e."areaId", e."systemStatus", e."userStatus", e."createdAt", e."decisionData",
         e."userId", e."evaluatorType", e.body
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND (${userFilterSql})
  ORDER BY e."areaId", e."createdAt" DESC, e.id DESC
)
SELECT l."areaId", l."systemStatus", l."userStatus", l."createdAt", l."evaluatorType",
       u."osmName" AS "authorOsmName", u."firstName" AS "authorFirstName", u."lastName" AS "authorLastName",
       COALESCE(c.comment_count, 0) AS comment_count,
       public.ST_XMin(g.env) AS min_lng, public.ST_YMin(g.env) AS min_lat,
       public.ST_XMax(g.env) AS max_lng, public.ST_YMax(g.env) AS max_lat,
       public.ST_X(g.center) AS center_lng, public.ST_Y(g.center) AS center_lat,
       count(*) OVER () AS total_count
FROM latest l
LEFT JOIN prisma."User" u ON u.id = l."userId"
LEFT JOIN (
  SELECT e."areaId", count(*)::int AS comment_count
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
    AND e.body IS NOT NULL
    AND btrim(e.body) <> ''
  GROUP BY e."areaId"
) c ON c."areaId" = l."areaId"
-- Inner join guarantees geometry (orphans without a map-table area are
-- reported on the admin QA config page instead).
INNER JOIN ${tableName} a ON a.id = l."areaId"
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
WHERE ${statusPredicate.sql}
  AND ${searchPredicate.sql}
  AND ${bboxFilterSql}
ORDER BY ${QA_ABSOLUTE_CHANGE_SORT_SQL} DESC NULLS LAST, l."areaId" ASC
LIMIT $${limitIndex}
`

  const rows = await db.$queryRawUnsafe<ListRow[]>(sql, ...params)
  const totalCount = rows[0] ? Number(rows[0].total_count ?? 0) : 0

  return {
    items: rows.map(
      (row) =>
        ({
          areaId: row.areaId,
          bbox: [
            Number(row.min_lng),
            Number(row.min_lat),
            Number(row.max_lng),
            Number(row.max_lat),
          ] satisfies [number, number, number, number],
          center: [Number(row.center_lng), Number(row.center_lat)] satisfies [number, number],
          systemStatus: row.systemStatus,
          userStatus: row.userStatus,
          createdAt: row.createdAt,
          evaluatorType: row.evaluatorType,
          authorOsmName: row.authorOsmName,
          authorFirstName: row.authorFirstName,
          authorLastName: row.authorLastName,
          commentCount: Number(row.comment_count ?? 0),
        }) satisfies QaAreaListItem,
    ),
    totalCount,
    limit,
  } satisfies QaAreaListResult
}
