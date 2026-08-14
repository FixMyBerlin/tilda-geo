import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import {
  MAX_USER_GEOJSON_BYTES,
  sanitizeUserGeojson,
  userGeojsonByteSize,
} from '@/lib/planningUserGeojson'
import { Prisma } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'
import { parseRegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import {
  areaInputFromRow,
  mergeFactorConfig,
  type MergedFactorConfig,
  type VariantFactorConfig,
} from './mergeFactorConfig'

export type { VariantFactorConfig }

// ── factorConfig schemas ───────────────────────────────────────────────────────
// Variant config: weights, thresholds, use_case — no geometry.
const VariantFactorConfigSchema = z
  .object({
    name: z.string().optional(),
    h3_resolution: z.number().int().min(6).max(15).optional(),
    dem_source: z.enum(['srtm', 'dgm1', 'mapterhorn']).optional(),
    weights: z.record(z.string(), z.number()).optional(),
    vegetation_direction: z.enum(['positive', 'negative']).optional(),
    cir_source: z.enum(['auto', 'bayern', 'bb', 'hessen']).optional(),
    max_cyclepath_dist_m: z.number().optional(),
    min_surface_score: z.number().optional(),
    exclude_carriageways: z.boolean().optional(),
    intersection_radius_m: z.number().optional(),
    parken_radius_m: z.number().optional(),
    fussgaengerzone_radius_m: z.number().optional(),
    bestand_default_diameter_m: z.number().optional(),
    min_score_threshold: z.number().min(0).max(100).optional(),
    targets: z.array(z.any()).optional(),
    use_case: z.string().optional(),
    area_size_m2: z.number().nullable().optional(),
  })
  .passthrough()

// Merged config (variant + area) — used by UI for map layers and worker payload.
export type FactorConfig = MergedFactorConfig

const StudyAreaSchema = z
  .any()
  .refine(
    (geom) => geom != null && studyAreaSizeKm2(geom as GeoJSON.Geometry) <= MAX_STUDY_AREA_KM2,
    { message: `Das Berechnungsgebiet darf maximal ${MAX_STUDY_AREA_KM2} km² groß sein.` },
  )

const UserGeojsonSchema = z
  .any()
  .optional()
  .transform((val, ctx) => {
    if (val === null) return null
    if (val === undefined) return undefined
    try {
      const clean = sanitizeUserGeojson(val as GeoJSON.GeoJSON)
      if (userGeojsonByteSize(clean) > MAX_USER_GEOJSON_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Eigene Flächen zu groß (max. ${MAX_USER_GEOJSON_BYTES / 1024 / 1024} MB).`,
        })
        return z.NEVER
      }
      return clean
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: (e as Error).message })
      return z.NEVER
    }
  })

const AreaGeometryInputSchema = z.object({
  studyArea: StudyAreaSchema,
  userGeojson: UserGeojsonSchema,
  userGeojsonMode: z.enum(['bonus', 'penalty', 'exclude_inside', 'exclude_outside']).optional(),
})

// ── Authorization helpers ──────────────────────────────────────────────────────

async function authorizeByArea(headers: Headers, areaId: number) {
  const session = await requireAuth(headers)
  const area = await db.planningArea.findFirstOrThrow({
    where: { id: areaId },
    select: { id: true, region: { select: { slug: true } } },
  })
  await authorizeRegionMemberByRegionSlug(session, area.region.slug)
  return session
}

async function authorizeByVariant(headers: Headers, variantId: number) {
  const session = await requireAuth(headers)
  const variant = await db.planningVariant.findFirstOrThrow({
    where: { id: variantId },
    select: { id: true, area: { select: { region: { select: { slug: true } } } } },
  })
  await authorizeRegionMemberByRegionSlug(session, variant.area.region.slug)
  return session
}

async function markRunsStaleForArea(areaId: number) {
  await db.planningRun.updateMany({
    where: {
      variant: { areaId },
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: false,
    },
    data: { stale: true },
  })
}

const jsonEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

async function deleteVariantPostgisResults(variantId: number) {
  const runs = await db.planningRun.findMany({
    where: { variantId },
    select: { id: true },
  })
  if (runs.length === 0) return
  const runIds = runs.map((r) => r.id)
  // Fine + aggregate grids share planning.scenario_hexagons (resolution column).
  await db.$executeRaw`DELETE FROM planning.scenario_hexagons WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM planning.scenario_vegetation WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM planning.scenario_carriageways WHERE run_id = ANY(${runIds})`
}

// ── Queries ───────────────────────────────────────────────────────────────────

const RegionSlugInput = z.object({ regionSlug: z.string() })

export const getPlanningAreasFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    return db.planningArea.findMany({
      where: { regionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        inputUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, osmName: true } },
        variants: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            currentRunId: true,
            createdAt: true,
            updatedAt: true,
            creator: { select: { id: true, osmName: true } },
            jobs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
            runs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { hexCount: true, stale: true, status: true },
            },
          },
        },
      },
    })
  })

const AreaIdInput = z.object({ areaId: z.number().int() })

export const getPlanningAreaFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByArea(getRequestHeaders(), data.areaId)
    return db.planningArea.findFirstOrThrow({
      where: { id: data.areaId },
      select: {
        id: true,
        title: true,
        studyArea: true,
        userGeojson: true,
        userGeojsonMode: true,
        inputUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, osmName: true } },
        variants: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            currentRunId: true,
            jobs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
            runs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { hexCount: true, stale: true, status: true },
            },
          },
        },
      },
    })
  })

const VariantIdInput = z.object({ variantId: z.number().int() })

export const getPlanningVariantFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    const variant = await db.planningVariant.findFirstOrThrow({
      where: { id: data.variantId },
      include: {
        area: {
          select: {
            id: true,
            title: true,
            studyArea: true,
            userGeojson: true,
            userGeojsonMode: true,
            inputUpdatedAt: true,
          },
        },
        creator: { select: { id: true, osmName: true } },
        runs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            hexCount: true,
            vegCount: true,
            stale: true,
            createdAt: true,
            cirAttribution: true,
          },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, errorMessage: true, resultRunId: true },
        },
      },
    })
    const factorConfig = mergeFactorConfig(
      areaInputFromRow(variant.area),
      variant.factorConfig as VariantFactorConfig,
    )
    return { ...variant, factorConfig: factorConfig as FactorConfig }
  })

const JobIdInput = z.object({ jobId: z.number().int() })

export const getPlanningJobFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof JobIdInput>) => JobIdInput.parse(data))
  .handler(async ({ data }) => {
    const job = await db.planningJob.findFirstOrThrow({
      where: { id: data.jobId },
      select: {
        id: true,
        status: true,
        errorMessage: true,
        variantId: true,
        resultRunId: true,
        progress: true,
        progressLabel: true,
        variant: {
          select: {
            factorConfig: true,
            area: {
              select: {
                studyArea: true,
                userGeojson: true,
                userGeojsonMode: true,
                region: { select: { slug: true } },
              },
            },
          },
        },
      },
    })
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, job.variant.area.region.slug)
    const fc = mergeFactorConfig(
      areaInputFromRow(job.variant.area),
      job.variant.factorConfig as VariantFactorConfig,
    )
    return {
      id: job.id,
      status: job.status,
      errorMessage: job.errorMessage,
      variantId: job.variantId,
      resultRunId: job.resultRunId,
      progress: job.progress,
      progressLabel: job.progressLabel,
      weights: (fc.weights ?? {}) as Record<string, number>,
      userGeojsonPresent: fc.user_geojson != null,
      userGeojsonMode: fc.user_geojson_mode ?? null,
    }
  })

const BoundarySearchInput = z.object({
  regionSlug: z.string(),
  query: z.string().max(100).default(''),
})

const MAX_BOUNDARY_RESULTS = 20

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&')

export const getAdminBoundariesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof BoundarySearchInput>) => BoundarySearchInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)

    const region = await db.region.findFirst({
      where: { slug: data.regionSlug },
      select: { maskOsmRelationIds: true, bbox: true },
    })
    const relationKeys = (region?.maskOsmRelationIds ?? []).map((id) => `relation/${id}`)
    const regionBbox = parseRegionGeoJsonBBox(region?.bbox)

    const regionFilter =
      relationKeys.length > 0
        ? Prisma.sql`AND ST_Intersects(
            b.geom,
            (SELECT ST_Union(geom) FROM public.boundaries WHERE id = ANY(${relationKeys}::text[]))
          )`
        : regionBbox
          ? Prisma.sql`AND ST_Intersects(
              b.geom,
              ST_Transform(
                ST_MakeEnvelope(${regionBbox[0]}, ${regionBbox[1]}, ${regionBbox[2]}, ${regionBbox[3]}, 4326),
                3857
              )
            )`
          : Prisma.empty

    const query = data.query.trim()
    const nameFilter =
      query === ''
        ? Prisma.empty
        : Prisma.sql`AND b.tags->>'name' ILIKE ${`%${escapeLikePattern(query)}%`}`

    const orderBy =
      query === ''
        ? Prisma.sql`ORDER BY (b.tags->>'admin_level')::int, b.tags->>'name'`
        : Prisma.sql`ORDER BY
            CASE
              WHEN lower(b.tags->>'name') = lower(${query}) THEN 0
              WHEN b.tags->>'name' ILIKE ${`${escapeLikePattern(query)}%`} THEN 1
              ELSE 2
            END,
            (b.tags->>'admin_level')::int,
            b.tags->>'name'`

    const rows = await db.$queryRaw<
      { id: string; name: string; name_prefix: string | null; admin_level: string }[]
    >`
      SELECT
        b.id,
        b.tags->>'name' AS name,
        b.tags->>'name_prefix' AS name_prefix,
        b.tags->>'admin_level' AS admin_level
      FROM public.boundaries b
      WHERE (b.tags->>'admin_level')::int IN (8, 9, 10)
        AND b.tags->>'name' IS NOT NULL
        AND b.tags->>'name' <> ''
        ${nameFilter}
        ${regionFilter}
      ${orderBy}
      LIMIT ${MAX_BOUNDARY_RESULTS + 1}
    `
    return {
      boundaries: rows.slice(0, MAX_BOUNDARY_RESULTS),
      hasMore: rows.length > MAX_BOUNDARY_RESULTS,
    }
  })

const BoundaryGeomInput = z.object({ regionSlug: z.string(), boundaryId: z.string() })

export const getBoundaryGeomFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof BoundaryGeomInput>) => BoundaryGeomInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)

    const rows = await db.$queryRaw<{ geom: object }[]>`
      SELECT ST_AsGeoJSON(ST_Transform(b.geom, 4326))::json AS geom
      FROM public.boundaries b
      WHERE b.id = ${data.boundaryId}
    `
    const geom = rows[0]?.geom
    if (!geom) throw new Error(`Gebietsgrenze ${data.boundaryId} nicht gefunden`)
    return geom
  })

// ── Mutations: Area ───────────────────────────────────────────────────────────

const CreateAreaInput = z.object({
  regionSlug: z.string(),
  title: z.string().min(1),
  ...AreaGeometryInputSchema.shape,
  variantTitle: z.string().min(1).optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a planning area and its first variant (no auto-run). */
export const createPlanningAreaFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateAreaInput>) => CreateAreaInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    const area = await db.planningArea.create({
      data: {
        regionId,
        creatorId: session.userId,
        title: data.title,
        studyArea: data.studyArea as Prisma.InputJsonValue,
        userGeojson: data.userGeojson as Prisma.InputJsonValue | undefined,
        userGeojsonMode: data.userGeojsonMode,
        variants: {
          create: {
            creatorId: session.userId,
            title: data.variantTitle ?? 'Variante 1',
            factorConfig: (data.factorConfig ?? {}) as Prisma.InputJsonValue,
          },
        },
      },
      select: {
        id: true,
        variants: { select: { id: true }, take: 1 },
      },
    })
    return { areaId: area.id, variantId: area.variants[0]!.id }
  })

const UpdateAreaInput = z.object({
  areaId: z.number().int(),
  title: z.string().min(1).optional(),
  studyArea: StudyAreaSchema.optional(),
  userGeojson: UserGeojsonSchema,
  userGeojsonMode: z.enum(['bonus', 'penalty', 'exclude_inside', 'exclude_outside']).optional(),
  markRunsStale: z.boolean().optional(),
})

export const updatePlanningAreaFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateAreaInput>) => UpdateAreaInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByArea(getRequestHeaders(), data.areaId)
    const existing = await db.planningArea.findFirstOrThrow({
      where: { id: data.areaId },
      select: { studyArea: true, userGeojson: true, userGeojsonMode: true },
    })
    const areaInputsChanged =
      data.markRunsStale === true ||
      (data.studyArea !== undefined && !jsonEqual(data.studyArea, existing.studyArea)) ||
      (data.userGeojson !== undefined &&
        !jsonEqual(data.userGeojson ?? null, existing.userGeojson ?? null)) ||
      (data.userGeojsonMode !== undefined && data.userGeojsonMode !== existing.userGeojsonMode)
    const result = await db.planningArea.update({
      where: { id: data.areaId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.studyArea !== undefined && { studyArea: data.studyArea as Prisma.InputJsonValue }),
        ...(data.userGeojson !== undefined && {
          userGeojson:
            data.userGeojson == null
              ? Prisma.DbNull
              : (data.userGeojson as unknown as Prisma.InputJsonValue),
        }),
        ...(data.userGeojsonMode !== undefined && { userGeojsonMode: data.userGeojsonMode }),
        ...(areaInputsChanged && { inputUpdatedAt: new Date() }),
      },
      select: { id: true },
    })
    if (areaInputsChanged) await markRunsStaleForArea(data.areaId)
    return result
  })

export const deletePlanningAreaFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByArea(getRequestHeaders(), data.areaId)
    const variants = await db.planningVariant.findMany({
      where: { areaId: data.areaId },
      select: { id: true },
    })
    for (const v of variants) await deleteVariantPostgisResults(v.id)
    await db.planningArea.delete({ where: { id: data.areaId } })
  })

// ── Mutations: Variant ────────────────────────────────────────────────────────

const UpdateVariantInput = z.object({
  variantId: z.number().int(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

export const updatePlanningVariantFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateVariantInput>) => UpdateVariantInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    return db.planningVariant.update({
      where: { id: data.variantId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.factorConfig !== undefined && {
          factorConfig: data.factorConfig as Prisma.InputJsonValue,
        }),
      },
      select: { id: true, areaId: true },
    })
  })

export const duplicatePlanningVariantFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    const session = await authorizeByVariant(getRequestHeaders(), data.variantId)
    const source = await db.planningVariant.findFirstOrThrow({
      where: { id: data.variantId },
      select: { areaId: true, title: true, factorConfig: true },
    })
    const created = await db.planningVariant.create({
      data: {
        areaId: source.areaId,
        creatorId: session.userId,
        parentId: data.variantId,
        title: `${source.title} (Kopie)`,
        factorConfig: source.factorConfig as Prisma.InputJsonValue,
      },
      select: { id: true, areaId: true },
    })
    return created
  })

const CreateVariantInput = z.object({
  areaId: z.number().int(),
  title: z.string().min(1).optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a new variant on an existing planungsgebiet (e.g. after all variants were deleted). */
export const createPlanningVariantFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateVariantInput>) => CreateVariantInput.parse(data))
  .handler(async ({ data }) => {
    const session = await authorizeByArea(getRequestHeaders(), data.areaId)
    const variantCount = await db.planningVariant.count({ where: { areaId: data.areaId } })
    return db.planningVariant.create({
      data: {
        areaId: data.areaId,
        creatorId: session.userId,
        title: data.title ?? `Variante ${variantCount + 1}`,
        factorConfig: (data.factorConfig ?? {}) as Prisma.InputJsonValue,
      },
      select: { id: true, areaId: true },
    })
  })

export const runPlanningVariantFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    const job = await db.planningJob.create({
      data: { variantId: data.variantId, status: 'QUEUED' },
      select: { id: true, status: true },
    })
    await db.$executeRaw`SELECT pg_notify('planning_jobs', ${String(job.id)})`
    return job
  })

export const deletePlanningVariantFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    await deleteVariantPostgisResults(data.variantId)
    await db.planningVariant.delete({ where: { id: data.variantId } })
  })
