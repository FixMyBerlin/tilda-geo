import {
  CATEGORY_SHARE_TOTAL,
  categoryEffect,
  readCategoryShares,
  rebalanceCategoryShares,
  type CategoryShares,
} from './categoryShares'
import { DEFAULT_OEPNV_SHARES, OEPNV_CATEGORY_KEYS, type OepnvCategory } from './oepnvCategories'

export type OepnvShares = CategoryShares<OepnvCategory>

/** Binds the generic category algorithm (`categoryShares.ts`) to the two
 * ÖPNV/bikesharing groups — see there for the calculation logic. */
export const OEPNV_SHARE_TOTAL = CATEGORY_SHARE_TOTAL

export const readOepnvShares = (stored: Partial<Record<string, number>> | undefined | null) =>
  readCategoryShares(OEPNV_CATEGORY_KEYS, DEFAULT_OEPNV_SHARES, stored)

export const rebalanceOepnvShares = (
  shares: OepnvShares,
  changed: OepnvCategory,
  nextValue: number,
) => rebalanceCategoryShares(OEPNV_CATEGORY_KEYS, shares, changed, nextValue)

export const oepnvCategoryEffect = (shares: OepnvShares, category: OepnvCategory) =>
  categoryEffect(OEPNV_CATEGORY_KEYS, shares, category)
