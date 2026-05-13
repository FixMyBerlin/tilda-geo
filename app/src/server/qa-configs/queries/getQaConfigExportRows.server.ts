import { z } from 'zod'
import { serializeMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import type { Prisma } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { getQaTableName } from '@/server/qa-configs/utils/getQaTableName'

const ExportInputSchema = z.object({
  configId: z.coerce.number().int().positive(),
})

/** Postgres `numeric` may arrive as string; export uses `number | null`. */
const qaExportNumericOrNullSchema = z
  .preprocess((v: unknown) => (v == null || v === '' ? null : v), z.coerce.number().nullable())
  .catch(null)

export type QaConfigExportRow = {
  area_id: string
  config_id: number
  config_slug: string
  config_map_table: string
  config_good_threshold: number
  config_needs_review_threshold: number
  config_absolute_difference_threshold: number
  latest_evaluation_id: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  /** Absolute map URL for this area (region + map + qa); empty when origin or centroid missing. */
  tilda_link: string
  count_reference: number | null
  count_current: number | null
  difference: number | null
  previous_relative: number | null
  relative: number | null
  system_status: string | null
  user_status: string | null
  evaluator_type: string | null
  evaluation_created_at: string | null
  body: string | null
  decision_data: string | null
  user_eval_count: number
  system_eval_count: number
}

function decisionDataToText(data: Prisma.JsonValue | null) {
  if (data == null) return null
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}

/** QA map style segment for shared links (`slug--all`; matches QA_STYLE_OPTIONS / searchParamsParsers.qa). */
const QA_DEEPLINK_STYLE = 'all'

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
  const qa = `${input.configSlug}--${QA_DEEPLINK_STYLE}`
  const params = new URLSearchParams({ map, qa, v: '2' })
  const base = origin.replace(/\/$/, '')
  return `${base}/regionen/${encodeURIComponent(input.regionSlug)}?${params.toString()}`
}

export async function getQaConfigExportRows(input: z.infer<typeof ExportInputSchema>) {
  const { configId } = ExportInputSchema.parse(input)

  const config = await db.qaConfig.findFirst({
    where: { id: configId },
    include: { region: { select: { slug: true } } },
  })

  if (!config) {
    return null
  }

  const tableName = getQaTableName(config.mapTable)

  const areaRows = await db.$queryRawUnsafe<
    Array<{
      area_id: string
      centroid_lat: string | number | null
      centroid_lng: string | number | null
      count_reference: number | null
      count_current: number | null
      difference: number | null
      previous_relative: string | number | null
      relative: string | number | null
    }>
  >(
    `
      SELECT
        id::text AS area_id,
        ROUND(ST_Y(ST_Transform(ST_Centroid(geom), 4326))::numeric, 5) AS centroid_lat,
        ROUND(ST_X(ST_Transform(ST_Centroid(geom), 4326))::numeric, 5) AS centroid_lng,
        count_reference,
        count_current,
        difference,
        previous_relative,
        relative
      FROM ${tableName}
      ORDER BY id::text
    `,
  )

  const [latestEvaluations, countGroups] = await Promise.all([
    db.qaEvaluation.findMany({
      where: { configId },
      orderBy: { createdAt: 'desc' },
      distinct: ['areaId'],
      select: {
        id: true,
        areaId: true,
        systemStatus: true,
        userStatus: true,
        evaluatorType: true,
        body: true,
        decisionData: true,
        createdAt: true,
      },
    }),
    db.qaEvaluation.groupBy({
      by: ['areaId', 'evaluatorType'],
      where: { configId },
      _count: { _all: true },
    }),
  ])

  const latestByAreaId = new Map(latestEvaluations.map((e) => [e.areaId, e]))

  const evalCountsByArea = new Map<string, { user: number; system: number }>()
  for (const g of countGroups) {
    const cur = evalCountsByArea.get(g.areaId) ?? { user: 0, system: 0 }
    if (g.evaluatorType === 'USER') {
      cur.user = g._count._all
    } else {
      cur.system = g._count._all
    }
    evalCountsByArea.set(g.areaId, cur)
  }

  const rows: QaConfigExportRow[] = []

  for (const a of areaRows) {
    const areaId = a.area_id
    const latest = latestByAreaId.get(areaId)
    const counts = evalCountsByArea.get(areaId) ?? { user: 0, system: 0 }
    const centroidLat = qaExportNumericOrNullSchema.parse(a.centroid_lat)
    const centroidLng = qaExportNumericOrNullSchema.parse(a.centroid_lng)

    rows.push({
      area_id: areaId,
      config_id: config.id,
      config_slug: config.slug,
      config_map_table: config.mapTable,
      config_good_threshold: config.goodThreshold,
      config_needs_review_threshold: config.needsReviewThreshold,
      config_absolute_difference_threshold: config.absoluteDifferenceThreshold,
      latest_evaluation_id: latest?.id ?? null,
      centroid_lat: centroidLat,
      centroid_lng: centroidLng,
      tilda_link: buildTildaLink({
        regionSlug: config.region.slug,
        configSlug: config.slug,
        centroidLat,
        centroidLng,
      }),
      count_reference: a.count_reference,
      count_current: a.count_current,
      difference: a.difference,
      previous_relative: qaExportNumericOrNullSchema.parse(a.previous_relative),
      relative: qaExportNumericOrNullSchema.parse(a.relative),
      system_status: latest?.systemStatus ?? null,
      user_status: latest?.userStatus ?? null,
      evaluator_type: latest?.evaluatorType ?? null,
      evaluation_created_at: latest ? formatDateTimeBerlin(latest.createdAt) : null,
      body: latest?.body ?? null,
      decision_data: decisionDataToText(latest?.decisionData ?? null),
      user_eval_count: counts.user,
      system_eval_count: counts.system,
    })
  }

  return { config, rows }
}
