import { describe, expect, it } from 'vitest'
import { DEFAULT_ZIELORT_SHARES } from './zielortCategories'
import {
  rebalanceZielortShares,
  readZielortShares,
  ZIELORT_SHARE_TOTAL,
  zielortCategoryEffect,
  type ZielortShares,
} from './zielortShares'

const total = (shares: ZielortShares) =>
  Object.values(shares).reduce((sum, value) => sum + value, 0)

describe('readZielortShares', () => {
  it('fällt ohne gespeicherten Wert auf Gleichverteilung zurück', () => {
    expect(readZielortShares(undefined)).toEqual(DEFAULT_ZIELORT_SHARES)
    expect(readZielortShares({})).toEqual(DEFAULT_ZIELORT_SHARES)
    expect(readZielortShares({ Bildung: 25 })).toEqual(DEFAULT_ZIELORT_SHARES)
  })

  it('normiert Altstände auf 100', () => {
    const shares = readZielortShares({
      Grundversorgung: 2,
      Bildung: 1,
      Einkauf: 1,
      Freizeit: 0,
    })
    expect(shares).toEqual({ Grundversorgung: 50, Bildung: 25, Einkauf: 25, Freizeit: 0 })
  })
})

describe('rebalanceZielortShares', () => {
  it('hält die Summe bei 100 und setzt den gezogenen Regler exakt', () => {
    const shares = rebalanceZielortShares(DEFAULT_ZIELORT_SHARES, 'Bildung', 40)
    expect(shares.Bildung).toBe(40)
    expect(total(shares)).toBe(ZIELORT_SHARE_TOTAL)
    // Die übrigen drei geben gleichmäßig ab, weil sie vorher gleich standen.
    expect(shares).toEqual({ Grundversorgung: 20, Bildung: 40, Einkauf: 20, Freizeit: 20 })
  })

  it('erhält das Verhältnis der übrigen Kategorien untereinander', () => {
    const start: ZielortShares = {
      Grundversorgung: 40,
      Bildung: 20,
      Einkauf: 20,
      Freizeit: 20,
    }
    const shares = rebalanceZielortShares(start, 'Freizeit', 40)
    expect(shares.Freizeit).toBe(40)
    expect(total(shares)).toBe(ZIELORT_SHARE_TOTAL)
    expect(shares.Grundversorgung).toBe(2 * shares.Bildung)
  })

  it('verteilt gleichmäßig, wenn die übrigen alle auf 0 stehen', () => {
    const start: ZielortShares = {
      Grundversorgung: 100,
      Bildung: 0,
      Einkauf: 0,
      Freizeit: 0,
    }
    const shares = rebalanceZielortShares(start, 'Grundversorgung', 40)
    expect(shares).toEqual({ Grundversorgung: 40, Bildung: 20, Einkauf: 20, Freizeit: 20 })
  })

  it('lässt eine Kategorie auf 100 und die anderen auf 0 zu', () => {
    const shares = rebalanceZielortShares(DEFAULT_ZIELORT_SHARES, 'Einkauf', 100)
    expect(shares).toEqual({ Grundversorgung: 0, Bildung: 0, Einkauf: 100, Freizeit: 0 })
  })
})

describe('zielortCategoryEffect', () => {
  it('lässt bei Gleichverteilung jede Kategorie voll wirken', () => {
    for (const key of ['Grundversorgung', 'Bildung', 'Einkauf', 'Freizeit'] as const) {
      expect(zielortCategoryEffect(DEFAULT_ZIELORT_SHARES, key)).toBe(1)
    }
  })

  it('normiert auf den größten Anteil — wie `zielort_category_factors` im Worker', () => {
    const shares: ZielortShares = {
      Grundversorgung: 25,
      Bildung: 40,
      Einkauf: 25,
      Freizeit: 10,
    }
    expect(zielortCategoryEffect(shares, 'Bildung')).toBe(1)
    expect(zielortCategoryEffect(shares, 'Freizeit')).toBeCloseTo(0.25)
    expect(zielortCategoryEffect(shares, 'Einkauf')).toBeCloseTo(0.625)
  })
})
