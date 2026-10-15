import { DEFAULT_FACTOR_TEMPLATE } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/factors/spaceFinderDefaults'
import { sanitizeUserGeojson } from '@/lib/planningUserGeojson'
import type { Prisma } from '@/prisma/generated/client'
import type { VariantFactorConfig } from '@/server/planning/mergeFactorConfig'
import db from '../../src/server/db.server'

/**
 * Flächenfinder (planning module) dev seeds — realistic Planungsgebiete around the Herrfurthplatz
 * in Neukölln so `bun run dev` has a good testing case straight away:
 * `/regionen/dev-flaechenfinder/flaechenfinder`.
 *
 * Region: `dev-flaechenfinder` (see `regionSeedCatalog.ts`) — `parkraum` setup with
 * `spaceFinderEnabled` on. `dev-flaechenfinder-empty` is configured alike but gets no data, so the
 * empty state ("Noch kein Planungsgebiet in dieser Region.") can be tested.
 *
 * Runs: none — every variant starts "noch nicht berechnet". Results come from "Berechnen" with the
 * local `planning-worker`.
 *
 * Geometry: local OSM processing data (bun run seed's geo-bootstrap) only exists inside the tiny
 * bbox `seed-herrfurthplatz` (`app/scripts/processing-generate-command/bboxPresets.ts`,
 * 13.4209256,52.4763157,13.4272212,52.4779464 — Herrfurthplatz/Schillerpromenade). Both study
 * areas below contain that bbox and the Eigene Daten lie inside it, so a real `planning-worker`
 * run has actual inputs to score.
 */

const PLANNING_REGION_SLUG = 'dev-flaechenfinder'
const PLANNING_CREATOR_EMAIL = 'tobias@fixmycity.de'
const HERRFURTHPLATZ_AREA_TITLE = 'Herrfurthplatz (mit Eigenen Daten)'

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
 * Second, smaller Planungsgebiet hugging the `seed-herrfurthplatz` bbox (13.4209256,52.4763157 –
 * 13.4272212,52.4779464) with a margin, so it contains all inputs. ~0.25 km².
 */
const HERRFURTHPLATZ_STUDY_AREA: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4195, 52.4771],
      [13.4202, 52.476],
      [13.424, 52.4755],
      [13.428, 52.476],
      [13.4287, 52.4771],
      [13.428, 52.4783],
      [13.424, 52.4788],
      [13.4202, 52.4783],
      [13.4195, 52.4771],
    ],
  ],
}

/** Three small "obstacle/bonus" squares inside the `seed-herrfurthplatz` bbox, to exercise Eigene Daten. */
const HERRFURTHPLATZ_USER_GEOJSON = sanitizeUserGeojson({
  type: 'FeatureCollection',
  features: [
    squareFeature(13.4225, 52.4772),
    squareFeature(13.424, 52.4767),
    squareFeature(13.4257, 52.4775),
  ],
})

function squareFeature(lng: number, lat: number, halfLng = 0.00015, halfLat = 0.00008) {
  const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
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
  return feature
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

/** The Herrfurthplatz "Eigene Daten" dataset (mode `bonus`); strength per variant in `eigendaten_weights`. */
const HERRFURTHPLATZ_USER_DATASET_ID = 'hindernisse'
const HERRFURTHPLATZ_USER_DATASETS = [
  {
    id: HERRFURTHPLATZ_USER_DATASET_ID,
    name: 'Hindernisse',
    mode: 'bonus' as const,
    geojson: HERRFURTHPLATZ_USER_GEOJSON,
  },
]

/** Non-zero strength so the Herrfurthplatz squares actually move the score. */
const herrfurthplatzFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Standard',
  eigendaten_weights: { [HERRFURTHPLATZ_USER_DATASET_ID]: 0.3 },
}

/** Stricter threshold and a stronger Eigene Daten bonus than "Standard". */
const hoehereSchwelleFactorConfig: VariantFactorConfig = {
  ...DEFAULT_FACTOR_TEMPLATE,
  name: 'Höhere Schwelle',
  min_score_threshold: 65,
  eigendaten_weights: { [HERRFURTHPLATZ_USER_DATASET_ID]: 0.5 },
}

// ── Seed ─────────────────────────────────────────────────────────────────────

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

  // `spaceFinderEnabled` comes from the region catalog. FMC admins (ADMIN role, e.g. `creator`) and
  // the region's own seeded admins/all-regions user (`memberships.ts`) already have access to this
  // member-only mode (`hasPermissions = role === 'ADMIN' || membership` in `regions.functions.ts`).
  if (!region.spaceFinderEnabled) {
    console.log(
      `⚠️ Skipping planning seed - region "${PLANNING_REGION_SLUG}" has spaceFinderEnabled off (regionSeedCatalog)`,
    )
    return
  }

  // Scoped, idempotent: safe to re-run `seedPlanning()` on its own without a full `bun run seed`.
  // Cascades to variants/runs/jobs (`onDelete: Cascade` in schema.prisma).
  await db.planningArea.deleteMany({ where: { regionId: region.id } })

  // ── a) Schillerkiez — "Standard" + "Nur ÖPNV-nah" ────────────────────────────────────────
  const schillerkiez = await db.planningArea.create({
    data: {
      regionId: region.id,
      createdById: creator.id,
      title: 'Schillerkiez',
      studyArea: SCHILLERKIEZ_STUDY_AREA as unknown as Prisma.InputJsonValue,
      useCase: 'fahrradbox',
      areaSizeM2: 2,
      variants: {
        create: [
          {
            createdById: creator.id,
            title: 'Standard',
            factorConfig: standardFactorConfig as Prisma.InputJsonValue,
          },
        ],
      },
    },
    select: { id: true, variants: { select: { id: true } } },
  })

  await db.planningVariant.create({
    data: {
      areaId: schillerkiez.id,
      createdById: creator.id,
      parentId: schillerkiez.variants[0]!.id,
      title: 'Nur ÖPNV-nah',
      factorConfig: oepnvNahFactorConfig as Prisma.InputJsonValue,
    },
  })

  // ── b) Herrfurthplatz — Eigene Daten, "Standard" + "Höhere Schwelle" ─────────────────────────
  const herrfurthplatz = await db.planningArea.create({
    data: {
      regionId: region.id,
      createdById: creator.id,
      title: HERRFURTHPLATZ_AREA_TITLE,
      studyArea: HERRFURTHPLATZ_STUDY_AREA as unknown as Prisma.InputJsonValue,
      userDatasets: HERRFURTHPLATZ_USER_DATASETS as unknown as Prisma.InputJsonValue,
      useCase: 'fahrradabstellanlage',
      areaSizeM2: 20,
      variants: {
        create: [
          {
            createdById: creator.id,
            title: 'Standard',
            factorConfig: herrfurthplatzFactorConfig as Prisma.InputJsonValue,
          },
        ],
      },
    },
    select: { id: true, variants: { select: { id: true } } },
  })

  await db.planningVariant.create({
    data: {
      areaId: herrfurthplatz.id,
      createdById: creator.id,
      parentId: herrfurthplatz.variants[0]!.id,
      title: 'Höhere Schwelle',
      factorConfig: hoehereSchwelleFactorConfig as Prisma.InputJsonValue,
    },
  })

  // ── c) empty-state region ────────────────────────────────────────────────────────────────
  // `dev-flaechenfinder-empty` deliberately keeps no Planungsgebiete (empty state).

  console.log(
    `✅ Seeded Flächenfinder: 2 Planungsgebiete (Schillerkiez, ${HERRFURTHPLATZ_AREA_TITLE}) in region "${PLANNING_REGION_SLUG}"`,
  )
}

export default seedPlanning
