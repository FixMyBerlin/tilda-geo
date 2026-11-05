import { describe, expect, it } from 'vitest'
import { buildSpaceFinderReviewProperties } from '@/shared/reviewLists/spaceFinderReviewEntry'
import { parseFactorConfigSnapshot } from './factorConfigSchema'
import { areaInputsDiffer, comparableRunSnapshot, factorsDiffer } from './factorFingerprint'
import { areaInputFromRow, mergeFactorConfig } from './mergeFactorConfig'

/**
 * Runs computed before the switch to several own datasets keep their frozen snapshot with a single
 * upload (`user_geojson`, `user_geojson_mode`, `weights.w_eigendaten`). The migration turns the
 * area's upload into dataset `d1`, and `parseFactorConfigSnapshot` reads old snapshots the same
 * way; these tests make sure such a run still reads as up to date everywhere.
 */
const studyArea = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4, 52.5],
      [13.5, 52.5],
      [13.5, 52.6],
      [13.4, 52.5],
    ],
  ],
}
const upload = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [13.45, 52.55] }, properties: {} },
  ],
}

// As the worker stored it before the switch (merged area + variant config).
const legacySnapshotJson = {
  name: 'Standard',
  weights: { w_cyclepath: 0.2, w_slope: 0.2, w_eigendaten: 0.3 },
  min_score_threshold: 60,
  study_area: studyArea,
  user_geojson: upload,
  user_geojson_mode: 'penalty',
  use_case: 'fahrradbox',
  area_size_m2: null,
  bewohnerbedarf_saettigung_ew: 30,
  bewohnerbedarf_saettigung_auto: false,
  bewohnerbedarf_saettigung_auto_ew: null,
  bewohnerbedarf_ew_pro_ha: null,
}

// The same area and variant after the migration.
const migratedArea = areaInputFromRow({
  studyArea,
  userDatasets: [{ id: 'd1', name: 'Eigene Daten', mode: 'penalty', geojson: upload }],
  useCase: 'fahrradbox',
  areaSizeM2: null,
  censusSaettigungEw: null,
  censusEwPerHa: null,
})
const migratedVariant = {
  name: 'Standard',
  weights: { w_cyclepath: 0.2, w_slope: 0.2 },
  eigendaten_weights: { d1: 0.3 },
  min_score_threshold: 60,
  bewohnerbedarf_saettigung_ew: 30,
}

describe('runs from before several own datasets', () => {
  const snapshot = parseFactorConfigSnapshot(legacySnapshotJson)
  const current = mergeFactorConfig(migratedArea, migratedVariant)

  it('reads the old upload as dataset d1 with its strength', () => {
    expect(snapshot.user_datasets).toEqual([
      { id: 'd1', name: 'Eigene Daten', mode: 'penalty', geojson: upload },
    ])
    expect(snapshot.eigendaten_weights).toEqual({ d1: 0.3 })
    expect(snapshot).not.toHaveProperty('user_geojson')
    expect(snapshot.weights).not.toHaveProperty('w_eigendaten')
  })

  it('counts an unchanged migrated variant as up to date (no "veraltet" banner)', () => {
    expect(factorsDiffer(current, comparableRunSnapshot(snapshot, migratedArea))).toBe(false)
    expect(areaInputsDiffer(current, snapshot)).toBe(false)
  })

  it('still notices a changed strength or mode against the old run', () => {
    const stronger = mergeFactorConfig(migratedArea, {
      ...migratedVariant,
      eigendaten_weights: { d1: 0.5 },
    })
    expect(factorsDiffer(stronger, comparableRunSnapshot(snapshot, migratedArea))).toBe(true)

    const bonusArea = {
      ...migratedArea,
      userDatasets: migratedArea.userDatasets!.map((dataset) => ({
        ...dataset,
        mode: 'bonus' as const,
      })),
    }
    expect(areaInputsDiffer(mergeFactorConfig(bonusArea, migratedVariant), snapshot)).toBe(true)
  })

  it('restores the old strength as eigendaten_weights when discarding to the old run', () => {
    const restored = comparableRunSnapshot(snapshot, migratedArea)!
    expect(restored.eigendaten_weights).toEqual({ d1: 0.3 })
    expect(restored.weights).not.toHaveProperty('w_eigendaten')
  })

  it('takes a review list entry over from the old run', () => {
    // As in createReviewEntriesFromSpaceFinder: names from the run snapshot.
    const names = Object.fromEntries(
      (snapshot.user_datasets ?? []).map((dataset) => [dataset.id, dataset.name]),
    )
    // Old tiles have no `eigendaten_details`: only the flag and the total score.
    const properties = buildSpaceFinderReviewProperties({
      candidateProperties: {
        eigendaten_ausschluss: false,
        score_bedarf: 40,
        score_eigendaten: -30,
      },
      areaTitle: 'Rixdorf',
      variantTitle: 'Standard',
      h3Id: '8d1f18b21c56bbf',
      eigendatenNames: names,
    })
    expect(names).toEqual({ d1: 'Eigene Daten' })
    expect(properties.Teilscores_markdown).toContain('Eigene Daten −30')
  })
})
