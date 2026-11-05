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
  it('falls back to an equal split without a stored value', () => {
    expect(readZielortShares(undefined)).toEqual(DEFAULT_ZIELORT_SHARES)
    expect(readZielortShares({})).toEqual(DEFAULT_ZIELORT_SHARES)
    expect(readZielortShares({ Bildung: 25 })).toEqual(DEFAULT_ZIELORT_SHARES)
  })

  it('normalizes old stored values to 100', () => {
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
  it('keeps the sum at 100 and sets the dragged slider exactly', () => {
    const shares = rebalanceZielortShares(DEFAULT_ZIELORT_SHARES, 'Bildung', 40)
    expect(shares.Bildung).toBe(40)
    expect(total(shares)).toBe(ZIELORT_SHARE_TOTAL)
    // The other three give up evenly because they were equal before.
    expect(shares).toEqual({ Grundversorgung: 20, Bildung: 40, Einkauf: 20, Freizeit: 20 })
  })

  it('keeps the ratio of the other categories to each other', () => {
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

  it('splits evenly when the others are all at 0', () => {
    const start: ZielortShares = {
      Grundversorgung: 100,
      Bildung: 0,
      Einkauf: 0,
      Freizeit: 0,
    }
    const shares = rebalanceZielortShares(start, 'Grundversorgung', 40)
    expect(shares).toEqual({ Grundversorgung: 40, Bildung: 20, Einkauf: 20, Freizeit: 20 })
  })

  it('allows one category at 100 and the others at 0', () => {
    const shares = rebalanceZielortShares(DEFAULT_ZIELORT_SHARES, 'Einkauf', 100)
    expect(shares).toEqual({ Grundversorgung: 0, Bildung: 0, Einkauf: 100, Freizeit: 0 })
  })
})

describe('zielortCategoryEffect', () => {
  it('applies every category fully with an equal split', () => {
    for (const key of ['Grundversorgung', 'Bildung', 'Einkauf', 'Freizeit'] as const) {
      expect(zielortCategoryEffect(DEFAULT_ZIELORT_SHARES, key)).toBe(1)
    }
  })

  it('normalizes to the largest share — like `zielort_category_factors` in the worker', () => {
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
