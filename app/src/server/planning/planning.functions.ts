import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
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
    max_cyclepath_dist_m: z.number().optional(),
    min_clearance_m: z.number().optional(),
    min_surface_score: z.number().optional(),
    max_slope_deg: z.number().optional(),
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
        parentId: true,
        currentRunId: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, osmName: true } },
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
          select: { id: true, status: true, hexCount: true, areaCount: true, createdAt: true },
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
    }
  })

// ── Mutations ───────────────────────────────────────────────────────────────────

const CreateScenarioInput = z.object({
  regionSlug: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  factorConfig: FactorConfigSchema,
  parentId: z.number().int().optional(),
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
        parentId: data.parentId,
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

// "Build upon": create a child scenario seeded from the parent's config.
const CreateChildInput = z.object({ parentId: z.number().int(), title: z.string().min(1) })

export const createChildPlanningScenarioFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateChildInput>) => CreateChildInput.parse(data))
  .handler(async ({ data }) => {
    const session = await authorizeByScenario(getRequestHeaders(), data.parentId)
    const parent = await db.planningScenario.findFirstOrThrow({
      where: { id: data.parentId },
      select: { regionId: true, factorConfig: true },
    })
    return db.planningScenario.create({
      data: {
        regionId: parent.regionId,
        creatorId: session.userId,
        parentId: data.parentId,
        title: data.title,
        factorConfig: parent.factorConfig as object,
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
