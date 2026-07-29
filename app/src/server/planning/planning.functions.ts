import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { staticRegion } from '@/data/regions.const'
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
    study_area: z.any(),
    // Nutzer-Upload „Eigene Flächen": sanitisiert (nur Geometrie, Typ-Whitelist,
    // Feature-/Koordinaten-Limits) und auf 5 MB begrenzt. Der Server vertraut dem
    // Client nicht: `sanitizeUserGeojson` läuft hier erneut und ersetzt den Wert
    // durch die minimale, geprüfte FeatureCollection.
    user_geojson: z
      .any()
      .optional()
      .transform((val, ctx) => {
        if (val == null) return undefined
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
      }),
    user_geojson_mode: z.enum(['bonus', 'penalty', 'exclude_inside', 'exclude_outside']).optional(),
  })
  .passthrough()
  .refine((c) => c.study_area != null, { message: 'study_area (GeoJSON) is required' })
  .refine(
    (c) =>
      c.study_area == null ||
      studyAreaSizeKm2(c.study_area as GeoJSON.Geometry) <= MAX_STUDY_AREA_KM2,
    { message: `Das Berechnungsgebiet darf maximal ${MAX_STUDY_AREA_KM2} km² groß sein.` },
  )

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
            vegCount: true,
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
        scenario: {
          select: { factorConfig: true, region: { select: { slug: true } } },
        },
      },
    })
    const session = await requireAuth(getRequestHeaders())
    await authorizeRegionMemberByRegionSlug(session, job.scenario.region.slug)
    const fc = job.scenario.factorConfig as FactorConfig | null
    return {
      id: job.id,
      status: job.status,
      errorMessage: job.errorMessage,
      scenarioId: job.scenarioId,
      resultRunId: job.resultRunId,
      progress: job.progress,
      progressLabel: job.progressLabel,
      // Die Faktor-Gewichte des Szenarios: Das UI leitet daraus pro Schritt ab,
      // ob er übersprungen wird (Gewicht 0) bzw. – bei ausschluss-gekoppelten
      // Faktoren – nur noch dem harten Ausschluss dient (siehe PlanningSteps).
      weights: (fc?.weights ?? {}) as Record<string, number>,
      // Der Eigendaten-Schritt läuft bei Ausschluss-Modi unabhängig vom Gewicht,
      // sobald eine Datei vorliegt – das UI braucht dafür Präsenz + Modus.
      userGeojsonPresent: fc?.user_geojson != null,
      userGeojsonMode: fc?.user_geojson_mode ?? null,
    }
  })

// Returns admin boundaries (level 8=Gemeinde, 9=Bezirk, 10=Ortsteil) filtered to the
// given region's geometry (looked up via the region's OSM relation IDs).
// Metadata only – shipping every geometry would be a few hundred kB per call (Berlin: ~560 kB),
// so the geometry is loaded on selection via `getBoundaryGeomFn`.
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
        AND (
          NOT ${hasRegionGeom}
          OR ST_Intersects(
            b.geom,
            (SELECT ST_Union(geom) FROM public.boundaries WHERE id = ANY(${relationKeys}::text[]))
          )
        )
      ORDER BY (b.tags->>'admin_level')::int, b.tags->>'name'
    `
    return rows
  })

const BoundaryGeomInput = z.object({ regionSlug: z.string(), boundaryId: z.string() })

// Returns the GeoJSON geometry (EPSG:4326) of a single admin boundary. Called when the user picks
// a boundary in the study-area combobox; `boundaries.id` is uniquely indexed, so the lookup is cheap.
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

// Delete a scenario and all its results (hexagons in the planning schema).
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
    }
    // PlanningJob and PlanningRun cascade-delete via FK.
    await db.planningScenario.delete({ where: { id: data.scenarioId } })
  })
