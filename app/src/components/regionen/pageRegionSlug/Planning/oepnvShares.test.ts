import { describe, expect, it } from 'vitest'
import { DEFAULT_OEPNV_SHARES } from './oepnvCategories'
import {
  oepnvCategoryEffect,
  OEPNV_SHARE_TOTAL,
  readOepnvShares,
  rebalanceOepnvShares,
  type OepnvShares,
} from './oepnvShares'

const total = (shares: OepnvShares) => Object.values(shares).reduce((sum, value) => sum + value, 0)

describe('readOepnvShares', () => {
  it('fällt ohne gespeicherten Wert auf 50/50 zurück', () => {
    expect(readOepnvShares(undefined)).toEqual(DEFAULT_OEPNV_SHARES)
    expect(readOepnvShares({})).toEqual(DEFAULT_OEPNV_SHARES)
    expect(readOepnvShares({ ÖPNV: 50 })).toEqual(DEFAULT_OEPNV_SHARES)
  })

  it('normiert Altstände auf 100', () => {
    const shares = readOepnvShares({ ÖPNV: 3, Bikesharing: 1 })
    expect(shares).toEqual({ ÖPNV: 75, Bikesharing: 25 })
  })
})

describe('rebalanceOepnvShares', () => {
  it('hält die Summe bei 100 und setzt den gezogenen Regler exakt', () => {
    const shares = rebalanceOepnvShares(DEFAULT_OEPNV_SHARES, 'ÖPNV', 80)
    expect(shares).toEqual({ ÖPNV: 80, Bikesharing: 20 })
    expect(total(shares)).toBe(OEPNV_SHARE_TOTAL)
  })

  it('lässt eine Gruppe auf 100 und die andere auf 0 zu', () => {
    const shares = rebalanceOepnvShares(DEFAULT_OEPNV_SHARES, 'Bikesharing', 100)
    expect(shares).toEqual({ ÖPNV: 0, Bikesharing: 100 })
  })
})

describe('oepnvCategoryEffect', () => {
  it('lässt bei Gleichverteilung jede Gruppe voll wirken', () => {
    expect(oepnvCategoryEffect(DEFAULT_OEPNV_SHARES, 'ÖPNV')).toBe(1)
    expect(oepnvCategoryEffect(DEFAULT_OEPNV_SHARES, 'Bikesharing')).toBe(1)
  })

  it('normiert auf den größeren Anteil — wie `oepnv_category_factors` im Worker', () => {
    const shares: OepnvShares = { ÖPNV: 80, Bikesharing: 20 }
    expect(oepnvCategoryEffect(shares, 'ÖPNV')).toBe(1)
    expect(oepnvCategoryEffect(shares, 'Bikesharing')).toBeCloseTo(0.25)
  })
})
