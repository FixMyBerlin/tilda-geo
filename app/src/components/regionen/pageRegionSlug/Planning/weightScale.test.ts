import { describe, expect, it } from 'vitest'
import { DEFAULT_FACTOR_TEMPLATE } from './planningDefaults'
import { criterionShares, groupShare, modifierPointRange, weightToPoints } from './weightScale'

// `FactorConfig` ist ein passthrough-Schema, `weights` daher `unknown` — für die Tests einmal
// zentral auf den tatsächlichen Typ festgelegt.
const DEFAULT_WEIGHTS = DEFAULT_FACTOR_TEMPLATE.weights as Record<string, number>

const rounded = (shares: Record<string, number>) =>
  Object.fromEntries(Object.entries(shares).map(([key, value]) => [key, Math.round(value)]))

describe('criterionShares', () => {
  it('verteilt die Anteile im Verhältnis der Wichtigkeiten', () => {
    // Defaults: Radwegnähe/Untergrund 2 Stufen, Zielorte/Hangneigung/ÖPNV je 1 → 7 Stufen gesamt.
    expect(rounded(criterionShares(DEFAULT_WEIGHTS))).toEqual({
      w_cyclepath: 29,
      w_transit: 14,
      w_target: 14,
      w_surface: 29,
      w_slope: 14,
    })
  })

  it('ergibt in Summe 100 %', () => {
    const total = Object.values(criterionShares(DEFAULT_WEIGHTS)).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(100)
  })

  it('ignoriert Zu-/Abschläge und Kriterien ohne Gewicht', () => {
    const shares = criterionShares({ w_cyclepath: 0.3, w_surface: 0.1, w_intersection: 0.5 })
    expect(rounded(shares)).toEqual({
      w_cyclepath: 75,
      w_transit: 0,
      w_target: 0,
      w_surface: 25,
      w_slope: 0,
    })
  })

  it('hängt nur am Verhältnis, nicht an der Summe der Gewichte', () => {
    expect(criterionShares({ w_cyclepath: 0.1, w_surface: 0.1 })).toEqual(
      criterionShares({ w_cyclepath: 0.5, w_surface: 0.5 }),
    )
  })

  it('bleibt bei 0, wenn kein Kriterium gewichtet ist', () => {
    expect(criterionShares({ w_intersection: 0.2 }).w_cyclepath).toBe(0)
  })
})

describe('groupShare', () => {
  it('summiert die Anteile einer Gruppe', () => {
    const shares = criterionShares(DEFAULT_WEIGHTS)
    expect(Math.round(groupShare(shares, ['w_cyclepath', 'w_transit', 'w_target']))).toBe(57)
    expect(Math.round(groupShare(shares, ['w_surface', 'w_slope']))).toBe(43)
  })
})

describe('modifierPointRange', () => {
  it('trennt Zuschläge von Abschlägen', () => {
    // Defaults: Kreuzungen + Parken + Fußgängerzonen je 10 Punkte Zuschlag, keine Abschläge.
    expect(modifierPointRange(DEFAULT_WEIGHTS, 'negative')).toEqual({ plus: 30, minus: 0 })
  })

  it('zählt Bestandsanlagen als Abschlag', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_bestand: 0.2 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 30, minus: 20 })
  })

  it('richtet die Vegetation nach der Vegetationsrichtung', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_vegetation: 0.15 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 30, minus: 15 })
    expect(modifierPointRange(weights, 'positive')).toEqual({ plus: 45, minus: 0 })
  })

  it('lässt das Eigendaten-Gewicht außen vor (eigene Kategorie)', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_eigendaten: 0.4 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 30, minus: 0 })
  })
})

describe('weightToPoints', () => {
  it('deckelt Altwerte über dem Regler-Maximum', () => {
    expect(weightToPoints(0.8)).toBe(50)
    expect(weightToPoints(undefined)).toBe(0)
  })
})
