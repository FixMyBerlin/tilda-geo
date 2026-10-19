import { describe, expect, it } from 'vitest'
import { parseFactorConfigSnapshot } from './factorConfigSchema'
import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
  runFreshnessAfterFactorSave,
} from './factorFingerprint'
import { mergeFactorConfig, type PlanningAreaInput, stripAutoSaettigung } from './mergeFactorConfig'

const area = (overrides: Partial<PlanningAreaInput> = {}): PlanningAreaInput => ({
  studyArea: { type: 'Polygon', coordinates: [] },
  useCase: 'fahrradbox',
  areaSizeM2: null,
  ...overrides,
})

describe('comparableRunSnapshot', () => {
  it('treats an old auto snapshot without threshold key as equal to the merged config', () => {
    const input = area({ censusSaettigungEw: 22, censusEwPerHa: 100 })
    const current = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    const oldSnapshot = { weights: { w_cyclepath: 0.2 } }
    expect(factorsDiffer(current, comparableRunSnapshot(oldSnapshot, input))).toBe(false)
  })

  it('detects a hand-set value against a snapshot with census suggestion', () => {
    const input = area({ censusSaettigungEw: 22 })
    const current = mergeFactorConfig(input, { bewohnerbedarf_saettigung_ew: 45 })
    const snapshot = mergeFactorConfig(input, {})
    expect(factorsDiffer(current, comparableRunSnapshot(snapshot, input))).toBe(true)
  })

  it('treats a new auto snapshot (threshold frozen) as equal to the current config', () => {
    const input = area({ censusSaettigungEw: 22 })
    const current = mergeFactorConfig(input, {})
    expect(factorsDiffer(current, comparableRunSnapshot(current, input))).toBe(false)
  })
})

describe('Eigene Daten in legacy snapshots', () => {
  const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
  const input = area({
    userDatasets: [{ id: 'd1', name: 'Eigene Daten', mode: 'bonus', geojson: fc }],
  })
  const current = mergeFactorConfig(input, { eigendaten_weights: { d1: 0.3 } })
  // Run from the single-upload era: file + mode + `weights.w_eigendaten`, read like all
  // snapshots (`parseFactorConfigSnapshot` upgrades it to datasets).
  const legacySnapshot = parseFactorConfigSnapshot({
    study_area: input.studyArea,
    use_case: 'fahrradbox',
    area_size_m2: null,
    user_geojson: fc,
    user_geojson_mode: 'bonus',
    weights: { w_eigendaten: 0.3 },
  })

  it('does not consider an unchanged legacy run outdated', () => {
    expect(factorsDiffer(current, comparableRunSnapshot(legacySnapshot, input))).toBe(false)
    expect(areaInputsDiffer(current, legacySnapshot)).toBe(false)
  })

  it('detects a changed strength against the legacy run', () => {
    const changed = mergeFactorConfig(input, { eigendaten_weights: { d1: 0.5 } })
    expect(factorsDiffer(changed, comparableRunSnapshot(legacySnapshot, input))).toBe(true)
  })

  it('detects an additional dataset as an area change', () => {
    const more = area({
      userDatasets: [
        ...input.userDatasets!,
        { id: 'x', name: 'Neu', mode: 'penalty', geojson: fc },
      ],
    })
    expect(areaInputsDiffer(mergeFactorConfig(more, {}), legacySnapshot)).toBe(true)
  })
})

describe('areaInputsDiffer', () => {
  it('is false for the same area even if factors differ', () => {
    const input = area({ censusSaettigungEw: 22 })
    const snapshot = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    const current = mergeFactorConfig(input, { weights: { w_cyclepath: 0.8 } })
    expect(areaInputsDiffer(current, snapshot)).toBe(false)
    expect(factorsDiffer(current, snapshot)).toBe(true)
  })

  it('detects a changed use case independent of the factors', () => {
    const snapshot = mergeFactorConfig(area({ useCase: 'fahrradbox' }), {})
    const current = mergeFactorConfig(area({ useCase: 'mobilitaetsstation' }), {})
    expect(areaInputsDiffer(current, snapshot)).toBe(true)
    expect(factorsDiffer(current, snapshot)).toBe(false)
  })

  it('detects a changed geometry', () => {
    const snapshot = mergeFactorConfig(area(), {})
    const current = mergeFactorConfig(
      area({
        studyArea: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      }),
      {},
    )
    expect(areaInputsDiffer(current, snapshot)).toBe(true)
  })
})

describe('runFreshnessAfterFactorSave', () => {
  const input = area({ censusSaettigungEw: 22 })

  it('leaves a non-existent run alone', () => {
    expect(runFreshnessAfterFactorSave({ weights: { w_cyclepath: 0.2 } }, input, null)).toBe('keep')
  })

  it('marks the run outdated when the factors differ from the snapshot', () => {
    const snapshot = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    const next = { ...stripAutoSaettigung(snapshot), weights: { w_cyclepath: 0.8 } }
    expect(runFreshnessAfterFactorSave(next, input, snapshot)).toBe('stale')
  })

  it('clears outdated when the factors match the run again', () => {
    const snapshot = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    expect(runFreshnessAfterFactorSave(stripAutoSaettigung(snapshot), input, snapshot)).toBe(
      'fresh',
    )
  })

  it('does not clear outdated while the area differs from the run', () => {
    const snapshot = mergeFactorConfig(area({ useCase: 'fahrradbox' }), {
      weights: { w_cyclepath: 0.2 },
    })
    expect(
      runFreshnessAfterFactorSave(
        stripAutoSaettigung(snapshot),
        area({ useCase: 'mobilitaetsstation' }),
        snapshot,
      ),
    ).toBe('keep')
  })
})

describe('outdatedBannerReason', () => {
  it('names both causes when area and factors are outdated', () => {
    expect(outdatedBannerReason(true, true)).toBe('Faktoren geändert und Planungsgebiet geändert')
  })

  it('names only the applicable cause', () => {
    expect(outdatedBannerReason(true, false)).toBe('Faktoren geändert')
    expect(outdatedBannerReason(false, true)).toBe('Planungsgebiet geändert')
    expect(outdatedBannerReason(false, false)).toBeNull()
  })
})
