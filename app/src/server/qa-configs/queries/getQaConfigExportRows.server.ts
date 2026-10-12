import { z } from 'zod'
import { serializeMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import type { Prisma, QaEvaluatorType } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { selectQaIndicatorTableRows } from '@/server/qa-configs/queries/qaIndicatorRows.server'
import { getQaTableName } from '@/server/qa-configs/utils/getQaTableName'
import {
  parseQaConfigIndicators,
  qaDatasetOf,
} from '@/server/qa-configs/utils/parseQaConfigIndicators'

const ExportInputSchema = z.object({
  configId: z.coerce.number().int().positive(),
})

/** Postgres `numeric` may arrive as string; export uses `number | null`. */
const qaExportNumericOrNullSchema = z
  .preprocess((v: unknown) => (v == null || v === '' ? null : v), z.coerce.number().nullable())
  .catch(null)

/** Long format: one row per (area, indicator). */
export type QaConfigExportRow = {
  area_id: string
  indicator_key: string
  config_id: number
  config_slug: string
  config_map_table: string
  config_dataset: string
  indicator_label: string
  indicator_unit: string
  indicator_good_threshold: number
  indicator_needs_review_threshold: number
  indicator_absolute_difference_threshold: number
  latest_evaluation_id: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  /** Absolute map URL for this area (region + map + qa); empty when origin or centroid missing. */
  tilda_link: string
  reference: number | null
  current: number | null
  difference: number | null
  deviation: number | null
  breakdown: string | null
  system_status: string | null
  user_status: string | null
  evaluator_type: string | null
  evaluation_created_at: string | null
  body: string | null
  decision_data: string | null
  user_eval_count: number
  system_eval_count: number
}

function jsonToText(data: unknown) {
  if (data == null) return null
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}

/** QA map link for shared exports (`qa` JSON with config slug). */
const QA_DEEPLINK_MAP_ZOOM = 19

function buildTildaLink(input: {
  regionSlug: string
  configSlug: string
  centroidLat: number | null
  centroidLng: number | null
}) {
  if (input.centroidLat == null || input.centroidLng == null) return ''
  const origin = getAppBaseUrl()
  if (!origin) return ''
  const map = serializeMapParam({
    zoom: QA_DEEPLINK_MAP_ZOOM,
    lat: input.centroidLat,
    lng: input.centroidLng,
  })
  const qa = JSON.stringify({ key: input.configSlug })
  const params = new URLSearchParams({ map, qa, v: '3' })
  return `${origin}/regionen/${input.regionSlug}/qa?${params.toString()}`
}

type LatestEvaluationRow = {
  id: number
  areaId: string
  indicatorKey: string
  systemStatus: string
  userStatus: string | null
  evaluatorType: QaEvaluatorType
  body: string | null
  decisionData: Prisma.JsonValue
  createdAt: Date
}

type EvaluationCountRow = {
  areaId: string
  indicatorKey: string
  evaluatorType: QaEvaluatorType
  count: bigint | number
}

const cellKey = (areaId: string, indicatorKey: string) => `${areaId} ${indicatorKey}`

export async function getQaConfigExportRows(input: z.infer<typeof ExportInputSchema>) {
  const { configId } = ExportInputSchema.parse(input)

  const config = await db.qaConfig.findFirst({
    where: { id: configId },
    include: { region: { select: { slug: true } } },
  })

  if (!config) {
    return null
  }
  const indicators = parseQaConfigIndicators(config.indicators)
  const { unit } = qaDatasetOf(config)
  const tableName = getQaTableName(config.mapTable)

  const areaRows = await db.$queryRawUnsafe<
    Array<{
      area_id: string
      centroid_lat: string | number | null
      centroid_lng: string | number | null
    }>
  >(
    `
      SELECT
        id::text AS area_id,
        ROUND(ST_Y(ST_Transform(ST_Centroid(geom), 4326))::numeric, 5) AS centroid_lat,
        ROUND(ST_X(ST_Transform(ST_Centroid(geom), 4326))::numeric, 5) AS centroid_lng
      FROM ${tableName}
      ORDER BY id::text
    `,
  )

  // Four set-based queries for the whole config; nothing runs per cell or per indicator.
  const [indicatorRows, latestEvaluations, countRows] = await Promise.all([
    selectQaIndicatorTableRows({ mapTable: config.mapTable }),
    db.$queryRawUnsafe<LatestEvaluationRow[]>(
      `
        SELECT DISTINCT ON (e."areaId", e."indicatorKey")
               e.id, e."areaId", e."indicatorKey", e."systemStatus", e."userStatus",
               e."evaluatorType", e.body, e."decisionData", e."createdAt"
        FROM prisma."QaEvaluation" e
        WHERE e."configId" = $1
        ORDER BY e."areaId", e."indicatorKey", e."createdAt" DESC, e.id DESC
      `,
      configId,
    ),
    db.$queryRawUnsafe<EvaluationCountRow[]>(
      `
        SELECT e."areaId", e."indicatorKey", e."evaluatorType", count(*)::int AS count
        FROM prisma."QaEvaluation" e
        WHERE e."configId" = $1
        GROUP BY e."areaId", e."indicatorKey", e."evaluatorType"
      `,
      configId,
    ),
  ])

  const indicatorRowByKey = new Map(
    indicatorRows.map((row) => [cellKey(row.areaId, row.indicatorKey), row]),
  )
  const latestByKey = new Map(
    latestEvaluations.map((row) => [cellKey(row.areaId, row.indicatorKey), row]),
  )

  const evalCounts = new Map<string, { user: number; system: number }>()
  for (const row of countRows) {
    const key = cellKey(row.areaId, row.indicatorKey)
    const counts = evalCounts.get(key) ?? { user: 0, system: 0 }
    if (row.evaluatorType === 'USER') {
      counts.user = Number(row.count)
    } else {
      counts.system = Number(row.count)
    }
    evalCounts.set(key, counts)
  }

  const rows: QaConfigExportRow[] = []

  for (const area of areaRows) {
    const areaId = area.area_id
    const centroidLat = qaExportNumericOrNullSchema.parse(area.centroid_lat)
    const centroidLng = qaExportNumericOrNullSchema.parse(area.centroid_lng)
    const tildaLink = buildTildaLink({
      regionSlug: config.region.slug,
      configSlug: config.slug,
      centroidLat,
      centroidLng,
    })

    for (const indicator of indicators) {
      const key = cellKey(areaId, indicator.key)
      const values = indicatorRowByKey.get(key)
      const latest = latestByKey.get(key)
      const counts = evalCounts.get(key) ?? { user: 0, system: 0 }

      rows.push({
        area_id: areaId,
        indicator_key: indicator.key,
        config_id: config.id,
        config_slug: config.slug,
        config_map_table: config.mapTable,
        config_dataset: config.dataset,
        indicator_label: indicator.label,
        indicator_unit: unit,
        indicator_good_threshold: indicator.goodThreshold,
        indicator_needs_review_threshold: indicator.needsReviewThreshold,
        indicator_absolute_difference_threshold: indicator.absoluteDifferenceThreshold,
        latest_evaluation_id: latest?.id ?? null,
        centroid_lat: centroidLat,
        centroid_lng: centroidLng,
        tilda_link: tildaLink,
        reference: values?.reference ?? null,
        current: values?.current ?? null,
        difference: values?.difference ?? null,
        deviation: values?.deviation ?? null,
        breakdown: jsonToText(values?.breakdown ?? null),
        system_status: latest?.systemStatus ?? null,
        user_status: latest?.userStatus ?? null,
        evaluator_type: latest?.evaluatorType ?? null,
        evaluation_created_at: latest ? formatDateTimeBerlin(latest.createdAt) : null,
        body: latest?.body ?? null,
        decision_data: jsonToText(latest?.decisionData ?? null),
        user_eval_count: counts.user,
        system_eval_count: counts.system,
      })
    }
  }

  return { config, rows }
}
