import { describe, expect, it } from 'vitest'
import {
  FALLBACK_SAETTIGUNG_EW,
  mergeFactorConfig,
  type PlanningAreaInput,
  stripAutoSaettigung,
} from './mergeFactorConfig'

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
