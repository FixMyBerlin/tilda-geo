import { describe, expect, it } from 'vitest'
import {
  FALLBACK_SAETTIGUNG_EW,
  mergeFactorConfig,
  normalizeLegacyEigendaten,
  type PlanningAreaInput,
  stripAutoSaettigung,
  syncEigendatenWeights,
  DEFAULT_EIGENDATEN_WEIGHT,
} from './mergeFactorConfig'

const emptyCollection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

describe('syncEigendatenWeights', () => {
  it('drops weights of removed datasets and gives new ones the start value', () => {
    const synced = syncEigendatenWeights(
      { weights: { w_slope: 0.2 }, eigendaten_weights: { a: 0.4, weg: 0.3, b: 0 } },
      [{ id: 'a' }, { id: 'b' }, { id: 'neu' }],
    )
    expect(synced).toEqual({
      weights: { w_slope: 0.2 },
      eigendaten_weights: { a: 0.4, b: 0, neu: DEFAULT_EIGENDATEN_WEIGHT },
    })
  })

  it('omits the field entirely without datasets', () => {
    expect(syncEigendatenWeights({ eigendaten_weights: { a: 0.4 } }, [])).toEqual({})
  })
})

describe('mergeFactorConfig — "Eigene Daten"', () => {
  const datasets = [
    { id: 'a', name: 'Wunschorte', mode: 'bonus' as const, geojson: emptyCollection },
    { id: 'b', name: 'Tabuzonen', mode: 'exclude_inside' as const, geojson: emptyCollection },
  ]

  it('takes all datasets of the area and keeps the variant weights', () => {
    const merged = mergeFactorConfig(
      { studyArea: {}, useCase: 'fahrradbox', areaSizeM2: null, userDatasets: datasets },
      { eigendaten_weights: { a: 0.3 } },
    )
    expect(merged.user_datasets).toEqual(datasets)
    expect(merged.eigendaten_weights).toEqual({ a: 0.3 })
  })

  it('omits user_datasets when the area has none — even from an old snapshot', () => {
    const merged = mergeFactorConfig(
      { studyArea: {}, useCase: 'fahrradbox', areaSizeM2: null, userDatasets: [] },
      { user_datasets: datasets } as never,
    )
    expect(merged).not.toHaveProperty('user_datasets')
  })
})

describe('normalizeLegacyEigendaten', () => {
  it('lifts the single-upload format to a dataset "d1" with a weight', () => {
    const legacy = {
      user_geojson: emptyCollection,
      user_geojson_mode: 'penalty',
      weights: { w_eigendaten: 0.4, w_slope: 0.1 },
    }
    const normalized = normalizeLegacyEigendaten(legacy as never) as Record<string, unknown>
    expect(normalized.user_datasets).toEqual([
      { id: 'd1', name: 'Eigene Daten', mode: 'penalty', geojson: emptyCollection },
    ])
    expect(normalized.eigendaten_weights).toEqual({ d1: 0.4 })
    expect(normalized.weights).toEqual({ w_slope: 0.1 })
    expect(normalized).not.toHaveProperty('user_geojson')
    expect(normalized).not.toHaveProperty('user_geojson_mode')
  })

  it('leaves new configs unchanged', () => {
    const current = { weights: { w_slope: 0.1 }, eigendaten_weights: { a: 0.2 } }
    expect(normalizeLegacyEigendaten(current)).toBe(current)
  })
})

const area = (overrides: Partial<PlanningAreaInput> = {}): PlanningAreaInput => ({
  studyArea: { type: 'Polygon', coordinates: [] },
  useCase: 'fahrradbox',
  areaSizeM2: null,
  ...overrides,
})

describe('mergeFactorConfig — resident demand saturation', () => {
  it('uses the census suggestion as long as the variant has no value of its own', () => {
    const merged = mergeFactorConfig(area({ censusSaettigungEw: 20, censusEwPerHa: 195.3 }), {})
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(20)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(true)
    expect(merged.bewohnerbedarf_ew_pro_ha).toBe(195.3)
  })

  it('keeps a manually set value and still reports the suggestion', () => {
    const merged = mergeFactorConfig(area({ censusSaettigungEw: 20 }), {
      bewohnerbedarf_saettigung_ew: 45,
    })
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(45)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(false)
    expect(merged.bewohnerbedarf_saettigung_auto_ew).toBe(20)
  })

  it('falls back to the worker default without census data, without claiming auto', () => {
    const merged = mergeFactorConfig(area(), {})
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(FALLBACK_SAETTIGUNG_EW)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(false)
    expect(merged.bewohnerbedarf_saettigung_auto_ew).toBeNull()
  })
})

describe('stripAutoSaettigung', () => {
  it('does not store the automatic value as a user value', () => {
    const stored = stripAutoSaettigung({
      weights: { w_bewohnerbedarf: 0.5 },
      bewohnerbedarf_saettigung_ew: 20,
      bewohnerbedarf_saettigung_auto: true,
      bewohnerbedarf_saettigung_auto_ew: 20,
      bewohnerbedarf_ew_pro_ha: 195.3,
    })
    expect(stored).toEqual({ weights: { w_bewohnerbedarf: 0.5 } })
  })

  it('keeps the overridden value and only drops the area markers', () => {
    const stored = stripAutoSaettigung({
      bewohnerbedarf_saettigung_ew: 45,
      bewohnerbedarf_saettigung_auto: false,
      bewohnerbedarf_saettigung_auto_ew: 20,
      bewohnerbedarf_ew_pro_ha: 195.3,
    })
    expect(stored).toEqual({ bewohnerbedarf_saettigung_ew: 45 })
  })
})
