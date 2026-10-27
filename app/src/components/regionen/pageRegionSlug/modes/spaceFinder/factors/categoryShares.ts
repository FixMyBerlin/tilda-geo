/**
 * Generic algorithm behind all "category split of a factor" sliders (Zielorte: 4 categories,
 * ÖPNV: 2) — the shares always sum to 100 %; dragging one slider distributes the rest
 * proportionally across the others. `zielortShares.ts`/`oepnvShares.ts` bind this to their
 * concrete categories/defaults; only the math lives here, once.
 */
export type CategoryShares<K extends string> = Record<K, number>

/** Sum of all category shares — always 100 (see `rebalanceCategoryShares`). */
export const CATEGORY_SHARE_TOTAL = 100

/** Slider step size. */
export const CATEGORY_SHARE_STEP = 5

/**
 * Reads the shares from a stored config. Missing or invalid values (old variants that don't
 * know the field yet) fall back to `defaults`.
 */
export const readCategoryShares = <K extends string>(
  keys: readonly K[],
  defaults: CategoryShares<K>,
  stored: Partial<Record<string, number>> | undefined | null,
) => {
  if (!stored) return { ...defaults }
  const values: number[] = []
  for (const key of keys) {
    const value = stored[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return { ...defaults }
    }
    values.push(value)
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return { ...defaults }
  // Normalize to 100: older stored values may be slightly off due to rounding.
  return distribute(
    keys,
    values.map((value) => (value / total) * CATEGORY_SHARE_TOTAL),
  )
}

/**
 * Rounds raw shares to whole percent so that they sum to exactly 100 (largest remainder: the
 * categories with the largest truncated fraction get the remainder).
 */
const distribute = <K extends string>(keys: readonly K[], raw: number[]) => {
  const floors = raw.map((value) => Math.floor(value))
  let remainder = CATEGORY_SHARE_TOTAL - floors.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
  for (const { index } of order) {
    if (remainder <= 0) break
    floors[index] = floors[index]! + 1
    remainder -= 1
  }
  return Object.fromEntries(keys.map((key, index) => [key, floors[index]!])) as CategoryShares<K>
}

/**
 * Sets one category to `nextValue` and distributes the rest across the others — proportionally
 * to their current ratio, so dragging a slider only changes the value being set and the others
 * keep their ratio to each other. If the others are all 0, the rest is split evenly (otherwise
 * the sum would stay below 100). With only two categories this simply becomes "the other one
 * gets the rest".
 */
export const rebalanceCategoryShares = <K extends string>(
  keys: readonly K[],
  shares: CategoryShares<K>,
  changed: K,
  nextValue: number,
) => {
  const value = Math.min(CATEGORY_SHARE_TOTAL, Math.max(0, Math.round(nextValue)))
  const others = keys.filter((key) => key !== changed)
  const othersTotal = others.reduce((sum, key) => sum + shares[key], 0)
  const rest = CATEGORY_SHARE_TOTAL - value
  const raw = keys.map((key) => {
    if (key === changed) return value
    return othersTotal > 0 ? (shares[key] / othersTotal) * rest : rest / others.length
  })
  const balanced = distribute(keys, raw)
  // The value being set is kept as is, not rounded — the others absorb the rounding difference.
  if (balanced[changed] !== value) {
    const diff = balanced[changed] - value
    balanced[changed] = value
    const target = others.reduce((a, b) => (balanced[a] >= balanced[b] ? a : b))
    balanced[target] += diff
  }
  return balanced
}

/**
 * Factor by which a single category's effect is dampened relative to the full effect — the same
 * normalization as in the worker (`zielort_category_factors`/`oepnv_category_factors` in
 * `config.py`): the largest category stands for 100 %, one weighted half as much for 50 %. With
 * an equal split, every category is fully effective.
 */
export const categoryEffect = <K extends string>(
  keys: readonly K[],
  shares: CategoryShares<K>,
  category: K,
) => {
  const max = Math.max(...keys.map((key) => shares[key]))
  return max > 0 ? shares[category] / max : 0
}
