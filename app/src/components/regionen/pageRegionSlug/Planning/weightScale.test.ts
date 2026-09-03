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
    // Defaults: Radwegnähe 2 Stufen, Hangneigung/ÖPNV je 1 → 4 Stufen gesamt. Zielorte ist kein
    // Kriterium mehr (siehe modifierPointRange-Tests unten).
    expect(rounded(criterionShares(DEFAULT_WEIGHTS))).toEqual({
      w_cyclepath: 50,
      w_transit: 25,
      w_slope: 25,
    })
  })

  it('ergibt in Summe 100 %', () => {
    const total = Object.values(criterionShares(DEFAULT_WEIGHTS)).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(100)
  })

  it('ignoriert Zu-/Abschläge und Kriterien ohne Gewicht', () => {
    const shares = criterionShares({ w_cyclepath: 0.3, w_intersection: 0.5 })
    expect(rounded(shares)).toEqual({
      w_cyclepath: 100,
      w_transit: 0,
      w_slope: 0,
    })
  })

  it('hängt nur am Verhältnis, nicht an der Summe der Gewichte', () => {
    expect(criterionShares({ w_cyclepath: 0.1, w_slope: 0.1 })).toEqual(
      criterionShares({ w_cyclepath: 0.5, w_slope: 0.5 }),
    )
  })

  it('bleibt bei 0, wenn kein Kriterium gewichtet ist', () => {
    expect(criterionShares({ w_intersection: 0.2 }).w_cyclepath).toBe(0)
  })
})

describe('groupShare', () => {
  it('summiert die Anteile einer Gruppe', () => {
    const shares = criterionShares(DEFAULT_WEIGHTS)
    expect(Math.round(groupShare(shares, ['w_cyclepath', 'w_transit']))).toBe(75)
    expect(Math.round(groupShare(shares, ['w_slope']))).toBe(25)
  })
})

describe('modifierPointRange', () => {
  it('trennt Zuschläge von Abschlägen', () => {
    // Defaults: Kreuzungen + Parken + Fußgängerzonen + Zielorte je 10 Punkte Zuschlag,
    // keine Abschläge.
    expect(modifierPointRange(DEFAULT_WEIGHTS, 'negative')).toEqual({ plus: 40, minus: 0 })
  })

  it('zählt Bestandsanlagen als Abschlag', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_bestand: 0.2 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 40, minus: 20 })
  })

  it('richtet die Vegetation nach der Vegetationsrichtung', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_vegetation: 0.15 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 40, minus: 15 })
    expect(modifierPointRange(weights, 'positive')).toEqual({ plus: 55, minus: 0 })
  })

  it('lässt das Eigendaten-Gewicht außen vor (eigene Kategorie)', () => {
    const weights = { ...DEFAULT_WEIGHTS, w_eigendaten: 0.4 }
    expect(modifierPointRange(weights, 'negative')).toEqual({ plus: 40, minus: 0 })
  })
})

describe('weightToPoints', () => {
  it('deckelt Altwerte über dem Regler-Maximum', () => {
    expect(weightToPoints(0.8)).toBe(50)
    expect(weightToPoints(undefined)).toBe(0)
  })
})
