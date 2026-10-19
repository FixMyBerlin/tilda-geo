import {
  CATEGORY_SHARE_TOTAL,
  categoryEffect,
  readCategoryShares,
  rebalanceCategoryShares,
  type CategoryShares,
} from './categoryShares'
import {
  DEFAULT_ZIELORT_SHARES,
  ZIELORT_CATEGORY_KEYS,
  type ZielortCategory,
} from './zielortCategories'

export type ZielortShares = CategoryShares<ZielortCategory>

/** Binds the generic category algorithm (`categoryShares.ts`) to the four target location
 * categories — see there for the calculation logic. */
export const ZIELORT_SHARE_TOTAL = CATEGORY_SHARE_TOTAL

export const readZielortShares = (stored: Partial<Record<string, number>> | undefined | null) =>
  readCategoryShares(ZIELORT_CATEGORY_KEYS, DEFAULT_ZIELORT_SHARES, stored)

export const rebalanceZielortShares = (
  shares: ZielortShares,
  changed: ZielortCategory,
  nextValue: number,
) => rebalanceCategoryShares(ZIELORT_CATEGORY_KEYS, shares, changed, nextValue)

export const zielortCategoryEffect = (shares: ZielortShares, category: ZielortCategory) =>
  categoryEffect(ZIELORT_CATEGORY_KEYS, shares, category)
