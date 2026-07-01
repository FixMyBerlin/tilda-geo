import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { staticRegion } from '@/data/regions.const'
import { Prisma } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'

// ── factorConfig (UseCaseConfig) ──────────────────────────────────────────────
// Permissive JSON consumed by the Python worker (flaechenfinder/config.py).
// `study_area` (GeoJSON geometry, EPSG:4326) is the only strictly required field.
const FactorConfigSchema = z
  .object({
    name: z.string().optional(),
    h3_resolution: z.number().int().min(6).max(15).optional(),
    dem_source: z.enum(['srtm', 'dgm1', 'mapterhorn']).optional(),
    weights: z.record(z.string(), z.number()).optional(),
    vegetation_direction: z.enum(['positive', 'negative']).optional(),
    cir_source: z.enum(['auto', 'bayern', 'bb']).optional(),
    max_cyclepath_dist_m: z.number().optional(),
    min_clearance_m: z.number().optional(),
    min_surface_score: z.number().optional(),
    min_score_threshold: z.number().optional(),
    targets: z.array(z.any()).optional(),
    study_area: z.any(),
  })
  .passthrough()
  .refine((c) => c.study_area != null, { message: 'study_area (GeoJSON) is required' })

export type FactorConfig = z.infer<typeof FactorConfigSchema>

// Derive a scenario's region slug + authorize the current user as a region member.
async function authorizeByScenario(headers: Headers, scenarioId: number) {
  const session = await requireAuth(headers)
  const scenario = await db.planningScenario.findFirstOrThrow({
    where: { id: scenarioId },
    select: { id: true, region: { select: { slug: true } } },
  })
  await authorizeRegionMemberByRegionSlug(session, scenario.region.slug)
  return session
}

// ── Queries ───────────────────────────────────────────────────────────────────

const RegionSlugInput = z.object({ regionSlug: z.string() })

export const getPlanningScenariosFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    return db.planningScenario.findMany({
      where: { regionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        currentRunId: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, osmName: true } },
        // Latest job for status display (loader / green checkmark in list).
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    })
  })

const ScenarioIdInput = z.object({ scenarioId: z.number().int() })

export const getPlanningScenarioFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof ScenarioIdInput>) => ScenarioIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByScenario(getRequestHeaders(), data.scenarioId)
    return db.planningScenario.findFirstOrThrow({
      where: { id: data.scenarioId },
      include: {
        creator: { select: { id: true, osmName: true } },
        runs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            hexCount: true,
            areaCount: true,
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
        scenarioId: true,
        resultRunId: true,
        progress: true,
        progressLabel: true,
        scenario: { select: { region: { select: { slug: true } } } },
      },
    })
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, job.scenario.region.slug)
    return {
      id: job.id,
      status: job.status,
      errorMessage: job.errorMessage,
      scenarioId: job.scenarioId,
      resultRunId: job.resultRunId,
      progress: job.progress,
      progressLabel: job.progressLabel,
    }
  })

// Returns admin boundaries (level 8=Gemeinde, 9=Bezirk) filtered to the
// given region's geometry (looked up via the region's OSM relation IDs).
export const getAdminBoundariesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)

    const staticData = staticRegion.find((r) => r.slug === data.regionSlug)
    const osmRelationIds = staticData?.mask?.osmRelationIds ?? []
    const relationKeys = osmRelationIds.map((id) => `relation/${id}`)

    // If no region geometry exists in the DB (e.g. non-Berlin regions), fall back to all boundaries.
    const regionGeom =
      relationKeys.length > 0
        ? await db.$queryRaw<{ geom: object | null }[]>`
            SELECT ST_Union(geom) AS geom FROM public.boundaries WHERE id = ANY(${relationKeys}::text[])
          `
        : [{ geom: null }]

    const hasRegionGeom = regionGeom[0]?.geom != null

    const rows = await db.$queryRaw<
      { id: string; name: string; admin_level: string; geom: object }[]
    >`
      SELECT
        b.id,
        COALESCE(b.tags->>'name', b.tags->>'name:de', b.tags->>'official_name', 'Ohne Namen (' || b.id || ')') AS name,
        b.tags->>'admin_level' AS admin_level,
        ST_AsGeoJSON(ST_Transform(b.geom, 4326))::json AS geom
      FROM public.boundaries b
      WHERE (b.tags->>'admin_level')::int IN (8, 9)
        AND (
          NOT ${hasRegionGeom}
          OR ST_Intersects(
            b.geom,
            (SELECT ST_Union(geom) FROM public.boundaries WHERE id = ANY(${relationKeys}::text[]))
          )
        )
      ORDER BY (b.tags->>'admin_level')::int, COALESCE(b.tags->>'name', b.tags->>'name:de', b.tags->>'official_name', 'Ohne Namen (' || b.id || ')')
    `
    return rows
  })

// ── Mutations ───────────────────────────────────────────────────────────────────

const CreateScenarioInput = z.object({
  regionSlug: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  factorConfig: FactorConfigSchema,
})

export const createPlanningScenarioFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateScenarioInput>) => CreateScenarioInput.parse(data))
  .handler(async ({ data }) => {
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, data.regionSlug)
    const regionId = await getRegionIdBySlug(data.regionSlug)
    return db.planningScenario.create({
      data: {
        regionId,
        creatorId: session.userId,
        title: data.title,
        description: data.description,
        factorConfig: data.factorConfig as Prisma.InputJsonValue,
      },
      select: { id: true },
    })
  })

const UpdateScenarioInput = z.object({
  scenarioId: z.number().int(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  factorConfig: FactorConfigSchema.optional(),
})

export const updatePlanningScenarioFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateScenarioInput>) => UpdateScenarioInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByScenario(getRequestHeaders(), data.scenarioId)
    return db.planningScenario.update({
      where: { id: data.scenarioId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.factorConfig !== undefined && {
          factorConfig: data.factorConfig as Prisma.InputJsonValue,
        }),
      },
      select: { id: true },
    })
  })

// Enqueue a run: insert a QUEUED PlanningJob and wake the worker via NOTIFY.
export const runPlanningScenarioFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof ScenarioIdInput>) => ScenarioIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByScenario(getRequestHeaders(), data.scenarioId)
    const job = await db.planningJob.create({
      data: { scenarioId: data.scenarioId, status: 'QUEUED' },
      select: { id: true, status: true },
    })
    await db.$executeRaw`SELECT pg_notify('planning_jobs', ${String(job.id)})`
    return job
  })

// Delete a scenario and all its results (hexagons/areas in the planning schema).
export const deletePlanningScenarioFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof ScenarioIdInput>) => ScenarioIdInput.parse(data))
  .handler(async ({ data }) => {
    await authorizeByScenario(getRequestHeaders(), data.scenarioId)
    const runs = await db.planningRun.findMany({
      where: { scenarioId: data.scenarioId },
      select: { id: true },
    })
    if (runs.length > 0) {
      const runIds = runs.map((r) => r.id)
      await db.$executeRaw`DELETE FROM planning.scenario_hexagons WHERE run_id = ANY(${runIds})`
      await db.$executeRaw`DELETE FROM planning.scenario_areas    WHERE run_id = ANY(${runIds})`
    }
    // PlanningJob and PlanningRun cascade-delete via FK.
    await db.planningScenario.delete({ where: { id: data.scenarioId } })
  })
