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
  it('falls back to 50/50 without a stored value', () => {
    expect(readOepnvShares(undefined)).toEqual(DEFAULT_OEPNV_SHARES)
    expect(readOepnvShares({})).toEqual(DEFAULT_OEPNV_SHARES)
    expect(readOepnvShares({ ÖPNV: 50 })).toEqual(DEFAULT_OEPNV_SHARES)
  })

  it('normalizes legacy values to 100', () => {
    const shares = readOepnvShares({ ÖPNV: 3, Bikesharing: 1 })
    expect(shares).toEqual({ ÖPNV: 75, Bikesharing: 25 })
  })
})

describe('rebalanceOepnvShares', () => {
  it('keeps the sum at 100 and sets the dragged slider exactly', () => {
    const shares = rebalanceOepnvShares(DEFAULT_OEPNV_SHARES, 'ÖPNV', 80)
    expect(shares).toEqual({ ÖPNV: 80, Bikesharing: 20 })
    expect(total(shares)).toBe(OEPNV_SHARE_TOTAL)
  })

  it('allows one group at 100 and the other at 0', () => {
    const shares = rebalanceOepnvShares(DEFAULT_OEPNV_SHARES, 'Bikesharing', 100)
    expect(shares).toEqual({ ÖPNV: 0, Bikesharing: 100 })
  })
})

describe('oepnvCategoryEffect', () => {
  it('applies each group fully with an equal split', () => {
    expect(oepnvCategoryEffect(DEFAULT_OEPNV_SHARES, 'ÖPNV')).toBe(1)
    expect(oepnvCategoryEffect(DEFAULT_OEPNV_SHARES, 'Bikesharing')).toBe(1)
  })

  it('normalizes to the larger share — like `oepnv_category_factors` in the worker', () => {
    const shares: OepnvShares = { ÖPNV: 80, Bikesharing: 20 }
    expect(oepnvCategoryEffect(shares, 'ÖPNV')).toBe(1)
    expect(oepnvCategoryEffect(shares, 'Bikesharing')).toBeCloseTo(0.25)
  })
})
