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
  it('entfernt Stärken entfernter Datensätze und gibt neuen den Startwert', () => {
    const synced = syncEigendatenWeights(
      { weights: { w_slope: 0.2 }, eigendaten_weights: { a: 0.4, weg: 0.3, b: 0 } },
      [{ id: 'a' }, { id: 'b' }, { id: 'neu' }],
    )
    expect(synced).toEqual({
      weights: { w_slope: 0.2 },
      eigendaten_weights: { a: 0.4, b: 0, neu: DEFAULT_EIGENDATEN_WEIGHT },
    })
  })

  it('lässt das Feld ohne Datensätze ganz weg', () => {
    expect(syncEigendatenWeights({ eigendaten_weights: { a: 0.4 } }, [])).toEqual({})
  })
})

describe('mergeFactorConfig — Eigene Daten', () => {
  const datasets = [
    { id: 'a', name: 'Wunschorte', mode: 'bonus' as const, geojson: emptyCollection },
    { id: 'b', name: 'Tabuzonen', mode: 'exclude_inside' as const, geojson: emptyCollection },
  ]

  it('nimmt alle Datensätze des Gebiets und lässt die Stärken der Variante stehen', () => {
    const merged = mergeFactorConfig(
      { studyArea: {}, useCase: 'fahrradbox', areaSizeM2: null, userDatasets: datasets },
      { eigendaten_weights: { a: 0.3 } },
    )
    expect(merged.user_datasets).toEqual(datasets)
    expect(merged.eigendaten_weights).toEqual({ a: 0.3 })
  })

  it('lässt user_datasets weg, wenn das Gebiet keine hat — auch aus einem alten Snapshot', () => {
    const merged = mergeFactorConfig(
      { studyArea: {}, useCase: 'fahrradbox', areaSizeM2: null, userDatasets: [] },
      { user_datasets: datasets } as never,
    )
    expect(merged).not.toHaveProperty('user_datasets')
  })
})

describe('normalizeLegacyEigendaten', () => {
  it('hebt den Ein-Upload-Stand auf einen Datensatz „d1“ mit Stärke', () => {
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

  it('lässt neue Configs unverändert', () => {
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

describe('mergeFactorConfig — Bewohnerbedarf-Sättigung', () => {
  it('nimmt den Zensus-Vorschlag, solange die Variante keinen eigenen Wert hat', () => {
    const merged = mergeFactorConfig(area({ censusSaettigungEw: 20, censusEwPerHa: 195.3 }), {})
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(20)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(true)
    expect(merged.bewohnerbedarf_ew_pro_ha).toBe(195.3)
  })

  it('lässt einen von Hand gesetzten Wert stehen und nennt den Vorschlag weiterhin', () => {
    const merged = mergeFactorConfig(area({ censusSaettigungEw: 20 }), {
      bewohnerbedarf_saettigung_ew: 45,
    })
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(45)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(false)
    expect(merged.bewohnerbedarf_saettigung_auto_ew).toBe(20)
  })

  it('fällt ohne Zensusdaten auf den Worker-Default zurück, ohne Automatik zu behaupten', () => {
    const merged = mergeFactorConfig(area(), {})
    expect(merged.bewohnerbedarf_saettigung_ew).toBe(FALLBACK_SAETTIGUNG_EW)
    expect(merged.bewohnerbedarf_saettigung_auto).toBe(false)
    expect(merged.bewohnerbedarf_saettigung_auto_ew).toBeNull()
  })
})

describe('stripAutoSaettigung', () => {
  it('speichert den automatischen Wert nicht als Nutzerwert', () => {
    const stored = stripAutoSaettigung({
      weights: { w_bewohnerbedarf: 0.5 },
      bewohnerbedarf_saettigung_ew: 20,
      bewohnerbedarf_saettigung_auto: true,
      bewohnerbedarf_saettigung_auto_ew: 20,
      bewohnerbedarf_ew_pro_ha: 195.3,
    })
    expect(stored).toEqual({ weights: { w_bewohnerbedarf: 0.5 } })
  })

  it('behält den überschriebenen Wert und wirft nur die Gebiets-Marker weg', () => {
    const stored = stripAutoSaettigung({
      bewohnerbedarf_saettigung_ew: 45,
      bewohnerbedarf_saettigung_auto: false,
      bewohnerbedarf_saettigung_auto_ew: 20,
      bewohnerbedarf_ew_pro_ha: 195.3,
    })
    expect(stored).toEqual({ bewohnerbedarf_saettigung_ew: 45 })
  })
})
