import { DEFAULT_FACTOR_TEMPLATE } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/factors/spaceFinderDefaults'
import { sanitizeUserGeojson } from '@/lib/planningUserGeojson'
import type { Prisma } from '@/prisma/generated/client'
import { PlanningJobStatus, PlanningRunStatus } from '@/prisma/generated/client'
import {
  areaInputFromRow,
  mergeFactorConfig,
  type PlanningAreaInput,
  type VariantFactorConfig,
} from '@/server/planning/mergeFactorConfig'
import db from '../../src/server/db.server'

/**
 * Flächenfinder (Planungsmodul) dev seeds — a few realistic Planungsgebiete in Neukölln so
 * `bun run dev` has a good testing case straight away: `/regionen/parkraum/flaechenfinder`.
 *
 * Region: `parkraum` (see `regionSeedCatalog.ts`) — its map already centers on Neukölln
 * (`mapLat`/`mapLng` sit inside the Schillerkiez) and its backgrounds include
 * `parkraumkarte_neukoelln`. `spaceFinderEnabled` is `true` by default for every seed region
 * (`baseRegionConfig`), forced here again defensively.
 *
 * Geometry: local OSM processing data (bun run seed's geo-bootstrap) only exists inside the tiny
 * bbox `seed-herrfurthplatz` (`app/scripts/processing-generate-command/bboxPresets.ts`,
 * 13.4209256,52.4763157,13.4272212,52.4779464 — Herrfurthplatz/Schillerpromenade). Both study
 * areas below overlap that bbox so a real `planning-worker` run there has actual inputs to score.
 */

const PLANNING_REGION_SLUG = 'parkraum'
const PLANNING_CREATOR_EMAIL = 'tobias@fixmycity.de'

// ── Geometry ─────────────────────────────────────────────────────────────────

/**
 * Hand-drawn-looking polygon around Herrfurthplatz/Schillerpromenade, comfortably containing the
 * `seed-herrfurthplatz` bbox (13.4209256,52.4763157 – 13.4272212,52.4779464). ~0.8 km².
 */
const SCHILLERKIEZ_STUDY_AREA: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [13.43307, 52.47713],
      [13.430434, 52.479958],
      [13.42407, 52.48113],
      [13.417706, 52.479958],
      [13.41507, 52.47713],
      [13.417706, 52.474302],
      [13.42407, 52.47313],
      [13.430434, 52.474302],
      [13.43307, 52.47713],
    ],
  ],
}

/**
 * Second Planungsgebiet, just east of Schillerkiez — its west edge overlaps the bbox above (so it
 * still has real OSM inputs), extending toward the wider Neukölln/Rixdorf area. ~0.4 km².
 */
const RIXDORF_STUDY_AREA: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4355, 52.477],
      [13.433743, 52.479121],
      [13.4295, 52.48],
      [13.425257, 52.479121],
      [13.4235, 52.477],
      [13.425257, 52.474879],
      [13.4295, 52.474],
      [13.433743, 52.474879],
      [13.4355, 52.477],
    ],
  ],
}

/** Three small "obstacle/bonus" squares inside `RIXDORF_STUDY_AREA`, to exercise Eigene Daten. */
const RIXDORF_USER_GEOJSON = sanitizeUserGeojson({
  type: 'FeatureCollection',
  features: [
    squareFeature(13.429, 52.4775),
    squareFeature(13.431, 52.4765),
    squareFeature(13.427, 52.4768),
  ],
})

function squareFeature(
  lng: number,
  lat: number,
  halfLng = 0.00015,
  halfLat = 0.00008,
): GeoJSON.Feature<GeoJSON.Polygon> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - halfLng, lat - halfLat],
          [lng + halfLng, lat - halfLat],
          [lng + halfLng, lat + halfLat],
          [lng - halfLng, lat + halfLat],
          [lng - halfLng, lat - halfLat],
        ],
      ],
    },
  }
}

// ── Variant factorConfigs (all derived from DEFAULT_FACTOR_TEMPLATE) ───────────

const standardFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
}

const oepnvNahFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Nur ÖPNV-nah',
  weights: {
    ...DEFAULT_FACTOR_TEMPLATE.weights,
    w_transit: 0.6,
    w_cyclepath: 0.05,
    w_target: 0.02,
    w_slope: 0.05,
    w_intersection: 0.02,
    w_parken: 0.02,
    w_fussgaengerzone: 0.02,
    w_vegetation: 0,
    w_platz: 0,
    w_bestand: 0,
    w_bewohnerbedarf: 0,
  },
}

const ohneHangneigungFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Ohne Hangneigung',
  weights: {
    ...DEFAULT_FACTOR_TEMPLATE.weights,
    w_slope: 0,
  },
}

/** Non-zero `w_eigendaten` so the Rixdorf obstacle squares actually move the score. */
const rixdorfFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Standard',
  weights: {
    ...DEFAULT_FACTOR_TEMPLATE.weights,
    w_eigendaten: 0.3,
  },
}

/** Current (post-edit) config of the "veraltet" demo variant — threshold raised after the run below. */
const staleDemoCurrentFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Alte Berechnung',
  min_score_threshold: 65,
}

/** Config as it was when the fake run "completed" — lower threshold, matches the frozen snapshot. */
const staleDemoRunFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Alte Berechnung',
  min_score_threshold: 60,
}

// ── Seed ─────────────────────────────────────────────────────────────────────

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const seedPlanning = async () => {
  const region = await db.region.findFirst({ where: { slug: PLANNING_REGION_SLUG } })
  if (!region) {
    console.log(
      `⚠️ Skipping planning seed - region "${PLANNING_REGION_SLUG}" not found (run seedRegions first)`,
    )
    return
  }

  const creator = await db.user.findFirst({ where: { email: PLANNING_CREATOR_EMAIL } })
  if (!creator) {
    console.log(
      `⚠️ Skipping planning seed - user "${PLANNING_CREATOR_EMAIL}" not found (run seedLocalAccess first)`,
    )
    return
  }

  // `spaceFinderEnabled` already defaults to `true` for every seeded region (`baseRegionConfig`
  // in `regionSeedCatalog.ts`); this is a defensive belt-and-braces in case that ever changes.
  // FMC admins (ADMIN role, e.g. `creator`) and the region's own seeded admins/all-regions user
  // (`memberships.ts`) already have access to this member-only mode — no extra membership rows
  // needed here (`hasPermissions = role === 'ADMIN' || membership` in `regions.functions.ts`).
  if (!region.spaceFinderEnabled) {
    await db.region.update({ where: { id: region.id }, data: { spaceFinderEnabled: true } })
  }

  // Scoped, idempotent: safe to re-run `seedPlanning()` on its own without a full `bun run seed`.
  // Cascades to variants/runs/jobs (`onDelete: Cascade` in schema.prisma).
  await db.planningArea.deleteMany({ where: { regionId: region.id } })

  // ── a) Schillerkiez — 3 variants, no runs (user clicks "Berechnen" themselves) ──────────────
  const schillerkiez = await db.planningArea.create({
    data: {
      regionId: region.id,
      creatorId: creator.id,
      title: 'Schillerkiez',
      studyArea: SCHILLERKIEZ_STUDY_AREA as unknown as Prisma.InputJsonValue,
      useCase: 'fahrradbox',
      areaSizeM2: 2,
      variants: {
        create: [
          {
            creatorId: creator.id,
            title: 'Standard',
            factorConfig: standardFactorConfig as Prisma.InputJsonValue,
          },
        ],
      },
    },
    select: { id: true, variants: { select: { id: true } } },
  })
  const schillerkiezStandardVariantId = schillerkiez.variants[0]!.id

  await db.planningVariant.create({
    data: {
      areaId: schillerkiez.id,
      creatorId: creator.id,
      parentId: schillerkiezStandardVariantId,
      title: 'Nur ÖPNV-nah',
      factorConfig: oepnvNahFactorConfig as Prisma.InputJsonValue,
    },
  })
  await db.planningVariant.create({
    data: {
      areaId: schillerkiez.id,
      creatorId: creator.id,
      parentId: schillerkiezStandardVariantId,
      title: 'Ohne Hangneigung',
      factorConfig: ohneHangneigungFactorConfig as Prisma.InputJsonValue,
    },
  })

  // ── b) Rixdorf — 1 variant with Eigene Daten, + c) a 2nd variant demoing "veraltet" ─────────
  const rixdorf = await db.planningArea.create({
    data: {
      regionId: region.id,
      creatorId: creator.id,
      title: 'Rixdorf',
      studyArea: RIXDORF_STUDY_AREA as unknown as Prisma.InputJsonValue,
      userGeojson: RIXDORF_USER_GEOJSON as unknown as Prisma.InputJsonValue,
      userGeojsonMode: 'bonus',
      useCase: 'fahrradabstellanlage',
      areaSizeM2: 20,
      variants: {
        create: [
          {
            creatorId: creator.id,
            title: 'Standard',
            factorConfig: rixdorfFactorConfig as Prisma.InputJsonValue,
          },
        ],
      },
    },
    select: { id: true, variants: { select: { id: true } } },
  })

  const staleDemoVariant = await db.planningVariant.create({
    data: {
      areaId: rixdorf.id,
      creatorId: creator.id,
      title: 'Alte Berechnung (veraltet)',
      factorConfig: staleDemoCurrentFactorConfig as Prisma.InputJsonValue,
    },
    select: { id: true },
  })

  // Simulate history: a run completed 3 days ago at threshold 60, then the user raised the
  // threshold to 65 afterwards (`min_score_threshold` above) without re-running — exactly what
  // `updatePlanningVariantFn` + `markRunsStaleForVariant` would produce. No real hexagon tiles are
  // written (`planning.scenario_hexagons` stays empty for this run): the map layer for it is just
  // empty, same as any run without matches — the "veraltet" banner/badge are pure DB-field reads
  // (`PlanningRun.stale`, and a live factorConfig/snapshot diff), so this is safe without the
  // planning-worker container.
  const rixdorfAreaInput: PlanningAreaInput = areaInputFromRow({
    studyArea: RIXDORF_STUDY_AREA as unknown as Prisma.JsonValue,
    userGeojson: RIXDORF_USER_GEOJSON as unknown as Prisma.JsonValue,
    userGeojsonMode: 'bonus',
    useCase: 'fahrradabstellanlage',
    areaSizeM2: 20,
    censusSaettigungEw: null,
    censusEwPerHa: null,
  })
  const staleDemoRunSnapshot = mergeFactorConfig(rixdorfAreaInput, staleDemoRunFactorConfig)

  const runCreatedAt = daysAgo(3)
  const staleDemoRun = await db.planningRun.create({
    data: {
      variantId: staleDemoVariant.id,
      createdAt: runCreatedAt,
      factorConfigSnapshot: staleDemoRunSnapshot as Prisma.InputJsonValue,
      status: PlanningRunStatus.COMPLETE,
      stale: true,
      hexCount: 1842,
      vegCount: 913,
      cirAttribution: 'CIR Berlin 2023',
    },
    select: { id: true },
  })
  await db.planningVariant.update({
    where: { id: staleDemoVariant.id },
    data: { currentRunId: staleDemoRun.id },
  })
  await db.planningJob.create({
    data: {
      variantId: staleDemoVariant.id,
      createdAt: runCreatedAt,
      status: PlanningJobStatus.DONE,
      startedAt: runCreatedAt,
      finishedAt: new Date(runCreatedAt.getTime() + 3 * 60_000),
      resultRunId: staleDemoRun.id,
      progress: 100,
    },
  })

  // ── d) empty-state region ────────────────────────────────────────────────────────────────
  // `bb-kampagne` (Brandenburg) and the `dev-*` fixtures deliberately keep no Planungsgebiete, so
  // their `/flaechenfinder` shows the empty state ("Noch keine Planungsgebiete").

  console.log(
    `✅ Seeded Flächenfinder: 2 Planungsgebiete (Schillerkiez, Rixdorf) in region "${PLANNING_REGION_SLUG}"`,
  )
}

export default seedPlanning
