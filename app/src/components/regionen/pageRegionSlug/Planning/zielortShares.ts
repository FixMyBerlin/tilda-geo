import {
  CATEGORY_SHARE_STEP,
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

/** Bindet den generischen Kategorie-Algorithmus (`categoryShares.ts`) an die vier
 * Zielort-Kategorien — siehe dort für die Rechenlogik. */
export const ZIELORT_SHARE_TOTAL = CATEGORY_SHARE_TOTAL
export const ZIELORT_SHARE_STEP = CATEGORY_SHARE_STEP

export const readZielortShares = (
  stored: Partial<Record<string, number>> | undefined | null,
): ZielortShares => readCategoryShares(ZIELORT_CATEGORY_KEYS, DEFAULT_ZIELORT_SHARES, stored)

export const rebalanceZielortShares = (
  shares: ZielortShares,
  changed: ZielortCategory,
  nextValue: number,
): ZielortShares => rebalanceCategoryShares(ZIELORT_CATEGORY_KEYS, shares, changed, nextValue)

export const zielortCategoryEffect = (shares: ZielortShares, category: ZielortCategory) =>
  categoryEffect(ZIELORT_CATEGORY_KEYS, shares, category)
