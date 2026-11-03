import { check } from '@placemarkio/check-geojson'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { extractStudyAreaGeometry } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/extractStudyAreaGeometry'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/spaceFinderStudyAreaLimit'
import { sanitizeUserDatasets, StoredUserDatasetsSchema } from '@/lib/spaceFinderUserGeojson'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'
import { parseRegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import { authorizeSpaceFinderRegion } from './authorizeSpaceFinderRegion.server'
import { ensureAreaCensusStats, refreshAreaCensusStats } from './censusSaettigung.server'
import {
  parseFactorConfigSnapshot,
  parseVariantFactorConfig,
  VariantFactorConfigSchema,
} from './factorConfigSchema'
import { jsonEqualIgnoringKeyOrder, runFreshnessAfterFactorSave } from './factorFingerprint'
import {
  areaInputFromRow,
  keepStoredMinArea,
  mergeFactorConfig,
  type MergedFactorConfig,
  stripAutoSaettigung,
  syncEigendatenWeights,
} from './mergeFactorConfig'
import { checkParkingDataAvailable } from './parkingDataAvailability.server'
import { SpaceFinderUseCaseSchema, spaceFinderTitleSchema } from './spaceFinderFormSchemas'

// Merged config (variant + area) — used by UI for map layers and worker payload.
export type FactorConfig = MergedFactorConfig

const StudyAreaSchema = z.unknown().transform((val, ctx) => {
  if (val == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Bitte genau ein Polygon oder MultiPolygon hochladen.',
    })
    return z.NEVER
  }
  let parsed: GeoJSON.GeoJSON
  try {
    parsed = check(JSON.stringify(val))
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Ungültiges GeoJSON: ${(error as Error).message}`,
    })
    return z.NEVER
  }
  try {
    const geom = extractStudyAreaGeometry(parsed)
    if (studyAreaSizeKm2(geom) > MAX_STUDY_AREA_KM2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Das Berechnungsgebiet darf maximal ${MAX_STUDY_AREA_KM2} km² groß sein.`,
      })
      return z.NEVER
    }
    return geom
  } catch (e) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: (e as Error).message })
    return z.NEVER
  }
})

// The dataset list always replaces the full list (add, rename, remove, change mode).
// `undefined` = leave unchanged.
const UserDatasetsSchema = z
  .any()
  .optional()
  .transform((val, ctx) => {
    if (val === undefined) return undefined
    try {
      return sanitizeUserDatasets(val ?? [])
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: (e as Error).message })
      return z.NEVER
    }
  })

const AreaGeometryInputSchema = z.object({
  studyArea: StudyAreaSchema,
  userDatasets: UserDatasetsSchema,
})

// ── Authorization helpers ──────────────────────────────────────────────────────

async function authorizeByArea(headers: Headers, areaId: number) {
  const session = await requireAuth(headers)
  const area = await db.spaceFinderArea.findFirstOrThrow({
    where: { id: areaId },
    select: { id: true, region: { select: { slug: true } } },
  })
  await authorizeSpaceFinderRegion(session, area.region.slug)
  return session
}

async function authorizeByVariant(headers: Headers, variantId: number) {
  const session = await requireAuth(headers)
  const variant = await db.spaceFinderVariant.findFirstOrThrow({
    where: { id: variantId },
    select: { id: true, area: { select: { region: { select: { slug: true } } } } },
  })
  await authorizeSpaceFinderRegion(session, variant.area.region.slug)
  return session
}

async function markRunsStaleForArea(areaId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variant: { areaId },
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: false,
    },
    data: { stale: true },
  })
}

async function markRunsStaleForVariant(variantId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variantId,
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: false,
    },
    data: { stale: true },
  })
}

async function markRunsFreshForVariant(variantId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variantId,
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: true,
    },
    data: { stale: false },
  })
}

const jsonEqual = jsonEqualIgnoringKeyOrder

async function deleteVariantPostgisResults(variantId: number) {
  const runs = await db.spaceFinderRun.findMany({
    where: { variantId },
    select: { id: true },
  })
  if (runs.length === 0) return
  const runIds = runs.map((r) => r.id)
  // Fine + aggregate grids share space_finder.scenario_hexagons (resolution column).
  await db.$executeRaw`DELETE FROM space_finder.scenario_hexagons WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM space_finder.scenario_vegetation WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM space_finder.scenario_carriageways WHERE run_id = ANY(${runIds})`
}

// ── Queries ───────────────────────────────────────────────────────────────────

const RegionSlugInput = z.object({ regionSlug: z.string() })

export const getSpaceFinderAreasFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeSpaceFinderRegion(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    return db.spaceFinderArea.findMany({
      where: { regionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        inputUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, osmName: true } },
        variants: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            currentRunId: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { id: true, osmName: true } },
            jobs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true },
            },
            runs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { hexCount: true, stale: true, status: true, createdAt: true },
            },
          },
        },
      },
    })
  })

const AreaIdInput = z.object({ areaId: z.number().int() })

export const getSpaceFinderAreaFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByArea(getRequestHeaders(), data.areaId)
    return db.spaceFinderArea.findFirstOrThrow({
      where: { id: data.areaId },
      select: {
        id: true,
        title: true,
        studyArea: true,
        userDatasets: true,
        useCase: true,
        areaSizeM2: true,
        censusSaettigungEw: true,
        censusEwPerHa: true,
        inputUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, osmName: true } },
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

export const getSpaceFinderVariantFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    const variant = await db.spaceFinderVariant.findFirstOrThrow({
      where: { id: data.variantId },
      include: {
        area: {
          select: {
            id: true,
            title: true,
            studyArea: true,
            userDatasets: true,
            useCase: true,
            areaSizeM2: true,
            censusSaettigungEw: true,
            censusEwPerHa: true,
            inputUpdatedAt: true,
          },
        },
        createdBy: { select: { id: true, osmName: true } },
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
            factorConfigSnapshot: true,
          },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, errorMessage: true, resultRunId: true },
        },
      },
    })
    // Areas created before the census suggestion existed backfill it here once — the factor
    // editor depends on this query, so this is where the value is needed.
    const stats = await ensureAreaCensusStats(variant.areaId)
    const area = {
      ...variant.area,
      userDatasets: StoredUserDatasetsSchema.parse(variant.area.userDatasets),
      ...(stats && { censusSaettigungEw: stats.saettigungEw, censusEwPerHa: stats.ewPerHa }),
    }
    const factorConfig = mergeFactorConfig(
      areaInputFromRow(area),
      parseVariantFactorConfig(variant.factorConfig),
    )
    const parkingDataAvailable = await checkParkingDataAvailable(area.studyArea)
    return {
      ...variant,
      area,
      factorConfig,
      parkingDataAvailable,
      runs: variant.runs.map((run) => ({
        ...run,
        factorConfigSnapshot: parseFactorConfigSnapshot(run.factorConfigSnapshot),
      })),
    }
  })

const JobIdInput = z.object({ jobId: z.number().int() })

export const getSpaceFinderJobFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof JobIdInput>) => JobIdInput.parse(data))
  .handler(async ({ data }) => {
    const job = await db.spaceFinderJob.findFirstOrThrow({
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
                userDatasets: true,
                useCase: true,
                areaSizeM2: true,
                censusSaettigungEw: true,
                censusEwPerHa: true,
                region: { select: { slug: true } },
              },
            },
          },
        },
      },
    })
    const session = await requireAuth(getRequestHeaders())
    await authorizeSpaceFinderRegion(session, job.variant.area.region.slug)
    const fc = mergeFactorConfig(
      areaInputFromRow(job.variant.area),
      parseVariantFactorConfig(job.variant.factorConfig),
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
      hasUserDatasets: (fc.user_datasets?.length ?? 0) > 0,
    }
  })

const BoundarySearchInput = z.object({
  regionSlug: z.string(),
  query: z.string().max(100).default(''),
})

const MAX_BOUNDARY_RESULTS = 20

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&')

export const getAdminBoundariesFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof BoundarySearchInput>) => BoundarySearchInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeSpaceFinderRegion(session, data.regionSlug)

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
  .validator((data: z.infer<typeof BoundaryGeomInput>) => BoundaryGeomInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeSpaceFinderRegion(session, data.regionSlug)

    const rows = await db.$queryRaw<{ geom: object }[]>`
      SELECT ST_AsGeoJSON(ST_Transform(b.geom, 4326))::json AS geom
      FROM public.boundaries b
      WHERE b.id = ${data.boundaryId}
    `
    const geom = rows[0]?.geom
    if (!geom) throw new Error(`Gebietsgrenze ${data.boundaryId} nicht gefunden`)
    return geom
  })

const HexagonGeomInput = z.object({ runId: z.number().int(), h3Id: z.string() })

/**
 * Full outline of one result hexagon (lng/lat). The vector tiles clip each hexagon to its
 * tile (`ST_AsMVTGeom`), so a candidate picked at a tile border would otherwise be stored
 * as a fragment.
 */
export const getSpaceFinderHexagonGeomFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof HexagonGeomInput>) => HexagonGeomInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    const run = await db.spaceFinderRun.findFirstOrThrow({
      where: { id: data.runId },
      select: { variant: { select: { area: { select: { region: { select: { slug: true } } } } } } },
    })
    await authorizeSpaceFinderRegion(session, run.variant.area.region.slug)

    const rows = await db.$queryRaw<{ geom: GeoJSON.Polygon }[]>`
      SELECT ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geom
      FROM space_finder.scenario_hexagons
      WHERE run_id = ${data.runId} AND h3_id = ${data.h3Id}
      LIMIT 1
    `
    const geom = rows[0]?.geom
    if (!geom) throw new Error(`Hexagon ${data.h3Id} nicht gefunden`)
    return geom
  })

// ── Mutations: Area ───────────────────────────────────────────────────────────

const CreateAreaInput = z.object({
  regionSlug: z.string(),
  title: spaceFinderTitleSchema,
  ...AreaGeometryInputSchema.shape,
  useCase: SpaceFinderUseCaseSchema.optional(),
  areaSizeM2: z.number().nullable().optional(),
  variantTitle: spaceFinderTitleSchema.optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a Planungsgebiet and its first variant (no auto-run). */
export const createSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof CreateAreaInput>) => CreateAreaInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await requireAuth(headers)
    await authorizeSpaceFinderRegion(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    return runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), async () => {
      // Two creates instead of a nested `variants: { create }`: the audit extension only logs the
      // top-level model, so a nested variant would get no CREATE row.
      const { area, variant } = await db.$transaction(async (tx) => {
        const area = await tx.spaceFinderArea.create({
          data: {
            regionId,
            createdById: session.userId,
            title: data.title,
            studyArea: data.studyArea as unknown as Prisma.InputJsonValue,
            userDatasets: (data.userDatasets ?? []) as unknown as Prisma.InputJsonValue,
            useCase: data.useCase ?? 'fahrradbox',
            areaSizeM2: data.areaSizeM2 ?? null,
          },
        })
        const variant = await tx.spaceFinderVariant.create({
          data: {
            areaId: area.id,
            createdById: session.userId,
            title: data.variantTitle ?? 'Variante 1',
            factorConfig: syncEigendatenWeights(
              stripAutoSaettigung(data.factorConfig ?? {}),
              data.userDatasets,
            ) as Prisma.InputJsonValue,
          },
        })
        return { area, variant }
      })
      await refreshAreaCensusStats(area.id, data.studyArea)
      return { areaId: area.id, variantId: variant.id }
    })
  })

const UpdateAreaInput = z.object({
  areaId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  studyArea: StudyAreaSchema.optional(),
  userDatasets: UserDatasetsSchema,
  useCase: SpaceFinderUseCaseSchema.optional(),
  areaSizeM2: z.number().nullable().optional(),
  markRunsStale: z.boolean().optional(),
})

export const updateSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof UpdateAreaInput>) => UpdateAreaInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByArea(headers, data.areaId)
    return runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), async () => {
      const existing = await db.spaceFinderArea.findFirstOrThrow({
        where: { id: data.areaId },
        select: {
          studyArea: true,
          userDatasets: true,
          useCase: true,
          areaSizeM2: true,
        },
      })
      const userDatasetsChanged =
        data.userDatasets !== undefined && !jsonEqual(data.userDatasets, existing.userDatasets)
      const areaInputsChanged =
        data.markRunsStale === true ||
        (data.studyArea !== undefined && !jsonEqual(data.studyArea, existing.studyArea)) ||
        userDatasetsChanged ||
        (data.useCase !== undefined && data.useCase !== existing.useCase) ||
        (data.areaSizeM2 !== undefined && data.areaSizeM2 !== existing.areaSizeM2)
      // Datasets added or removed: sync the strengths of all variants (new ones with the
      // initial value, removed ones dropped), otherwise orphaned keys remain in factorConfig.
      if (userDatasetsChanged) {
        const variants = await db.spaceFinderVariant.findMany({
          where: { areaId: data.areaId },
          select: { id: true, factorConfig: true },
        })
        for (const variant of variants) {
          const current = parseVariantFactorConfig(variant.factorConfig)
          const synced = syncEigendatenWeights(current, data.userDatasets)
          if (jsonEqual(synced, current)) continue
          await db.spaceFinderVariant.update({
            where: { id: variant.id },
            data: { factorConfig: synced as Prisma.InputJsonValue },
          })
        }
      }
      const result = await db.spaceFinderArea.update({
        where: { id: data.areaId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.studyArea !== undefined && {
            studyArea: data.studyArea as unknown as Prisma.InputJsonValue,
          }),
          ...(data.userDatasets !== undefined && {
            userDatasets: data.userDatasets as unknown as Prisma.InputJsonValue,
          }),
          ...(data.useCase !== undefined && { useCase: data.useCase }),
          ...(data.areaSizeM2 !== undefined && { areaSizeM2: data.areaSizeM2 }),
          ...(areaInputsChanged && { inputUpdatedAt: new Date() }),
        },
      })
      if (areaInputsChanged) await markRunsStaleForArea(data.areaId)
      // Only the geometry changes the census figures; title, use case or user datasets do not.
      if (data.studyArea !== undefined && !jsonEqual(data.studyArea, existing.studyArea)) {
        await refreshAreaCensusStats(data.areaId, data.studyArea)
      }
      return { id: result.id }
    })
  })

export const deleteSpaceFinderAreaFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof AreaIdInput>) => AreaIdInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByArea(headers, data.areaId)
    const variants = await db.spaceFinderVariant.findMany({
      where: { areaId: data.areaId },
      select: { id: true },
    })
    for (const v of variants) await deleteVariantPostgisResults(v.id)
    await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
      db.spaceFinderArea.delete({ where: { id: data.areaId } }),
    )
  })

// ── Mutations: Variant ────────────────────────────────────────────────────────

const UpdateVariantInput = z.object({
  variantId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  description: z.string().optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
  /** Set only the target size of the area search without sending the rest of factorConfig. */
  minAreaM2: z.number().min(0).nullable().optional(),
})

export const updateSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateVariantInput>) => UpdateVariantInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByVariant(headers, data.variantId)
    const existing = await db.spaceFinderVariant.findFirstOrThrow({
      where: { id: data.variantId },
      select: {
        factorConfig: true,
        area: {
          select: {
            studyArea: true,
            userDatasets: true,
            useCase: true,
            areaSizeM2: true,
            censusSaettigungEw: true,
            censusEwPerHa: true,
          },
        },
        runs: {
          where: { status: { in: ['COMPLETE', 'EMPTY'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { factorConfigSnapshot: true },
        },
      },
    })
    let factorConfig = data.factorConfig
    if (factorConfig !== undefined && data.minAreaM2 === undefined) {
      factorConfig = keepStoredMinArea(
        factorConfig,
        parseVariantFactorConfig(existing.factorConfig),
      )
    }
    if (data.minAreaM2 !== undefined) {
      factorConfig = {
        ...parseVariantFactorConfig(factorConfig ?? existing.factorConfig),
        min_area_m2: data.minAreaM2,
      }
    }
    // Sync with the area's datasets: a draft from before the last area save must not write
    // back strengths of removed datasets.
    const stored =
      factorConfig !== undefined
        ? syncEigendatenWeights(
            stripAutoSaettigung(factorConfig),
            areaInputFromRow(existing.area).userDatasets,
          )
        : undefined
    const result = await runWithAuditContextAsync(
      memberFormAuditContext(headers, session.userId),
      () =>
        db.spaceFinderVariant.update({
          where: { id: data.variantId },
          data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(stored !== undefined && {
              factorConfig: stored as Prisma.InputJsonValue,
            }),
          },
        }),
    )
    // Title and description do not change the result. `min_area_m2` is a client filter and does
    // not count in `runFreshnessAfterFactorSave`. A save that matches the last run again
    // (discarding changes) clears `stale` — as long as the area still matches.
    if (stored !== undefined) {
      const snapshot = existing.runs[0]
        ? parseFactorConfigSnapshot(existing.runs[0].factorConfigSnapshot)
        : null
      const freshness = runFreshnessAfterFactorSave(
        stored,
        areaInputFromRow(existing.area),
        snapshot,
      )
      if (freshness === 'stale') await markRunsStaleForVariant(data.variantId)
      if (freshness === 'fresh') await markRunsFreshForVariant(data.variantId)
    }
    return { id: result.id, areaId: result.areaId }
  })

export const duplicateSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByVariant(headers, data.variantId)
    const source = await db.spaceFinderVariant.findFirstOrThrow({
      where: { id: data.variantId },
      select: { areaId: true, title: true, factorConfig: true },
    })
    const created = await runWithAuditContextAsync(
      memberFormAuditContext(headers, session.userId),
      () =>
        db.spaceFinderVariant.create({
          data: {
            areaId: source.areaId,
            createdById: session.userId,
            parentId: data.variantId,
            title: `${source.title} (Kopie)`,
            factorConfig: source.factorConfig as Prisma.InputJsonValue,
          },
        }),
    )
    return { id: created.id, areaId: created.areaId }
  })

const CreateVariantInput = z.object({
  areaId: z.number().int(),
  title: spaceFinderTitleSchema.optional(),
  factorConfig: VariantFactorConfigSchema.optional(),
})

/** Creates a new variant on an existing planungsgebiet (e.g. after all variants were deleted). */
export const createSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateVariantInput>) => CreateVariantInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByArea(headers, data.areaId)
    const [variantCount, area] = await Promise.all([
      db.spaceFinderVariant.count({ where: { areaId: data.areaId } }),
      db.spaceFinderArea.findFirstOrThrow({
        where: { id: data.areaId },
        select: { userDatasets: true },
      }),
    ])
    const userDatasets = StoredUserDatasetsSchema.parse(area.userDatasets)
    const created = await runWithAuditContextAsync(
      memberFormAuditContext(headers, session.userId),
      () =>
        db.spaceFinderVariant.create({
          data: {
            areaId: data.areaId,
            createdById: session.userId,
            title: data.title ?? `Variante ${variantCount + 1}`,
            factorConfig: syncEigendatenWeights(
              stripAutoSaettigung(data.factorConfig ?? {}),
              userDatasets,
            ) as Prisma.InputJsonValue,
          },
        }),
    )
    return { id: created.id, areaId: created.areaId }
  })

export const runSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByVariant(getRequestHeaders(), data.variantId)
    const job = await db.spaceFinderJob.create({
      data: { variantId: data.variantId, status: 'QUEUED' },
      select: { id: true, status: true },
    })
    await db.$executeRaw`SELECT pg_notify('space_finder_jobs', ${String(job.id)})`
    return job
  })

export const deleteSpaceFinderVariantFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof VariantIdInput>) => VariantIdInput.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await authorizeByVariant(headers, data.variantId)
    // A Planungsgebiet always keeps at least one variant: the mode selects by variant id.
    const { areaId } = await db.spaceFinderVariant.findUniqueOrThrow({
      where: { id: data.variantId },
      select: { areaId: true },
    })
    const variantCount = await db.spaceFinderVariant.count({ where: { areaId } })
    if (variantCount <= 1) {
      throw new Error('Ein Planungsgebiet braucht mindestens eine Variante.')
    }
    await deleteVariantPostgisResults(data.variantId)
    await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
      db.spaceFinderVariant.delete({ where: { id: data.variantId } }),
    )
  })
