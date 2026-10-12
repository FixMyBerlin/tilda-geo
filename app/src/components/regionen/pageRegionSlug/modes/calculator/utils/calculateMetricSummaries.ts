import type { CalculatorMetric } from '../calculatorDatasets.const'
import { type CalculatorFilter, calculatorCombinedAreaId } from '../calculatorModeParam'

/**
 * The sums of the features of one area that share these tag values, as the server returns them
 * (`sumMeasureFeatures`). `properties` holds the group-by keys of the dataset (`''` for a missing
 * tag) and the part under `calculatorPartKey`.
 */
export type CalculatorRow = {
  area: string
  properties: Record<string, string>
  sums: Partial<Record<CalculatorMetric, number>>
}

type CalculatorGroupValueSummary = {
  /** Display value; a missing value is `(Ohne Angabe)`. */
  value: string
  /** The value as a filter stores it; a missing value is `''`. */
  filterValue: string
  sum: number
  ratio: number
}

type CalculatorGroupSummary = {
  key: string
  sum: number
  ratio: number
  values: CalculatorGroupValueSummary[]
}

type CalculatorMetricSummary = {
  total: number
  groups: CalculatorGroupSummary[]
}

export const calculatorMissingGroupValueLabel = '(Ohne Angabe)'

const toRatio = (value: number, total: number) => {
  if (total <= 0) return 0
  return value / total
}

/** A tag value as filters compare it: a missing value is `''`. */
const toFilterValue = (value: string | undefined) => value ?? ''

const matchesFilter = (
  properties: Record<string, string>,
  filter: CalculatorFilter,
  exceptKey?: string,
) =>
  Object.entries(filter).every(
    ([key, values]) => key === exceptKey || values.includes(toFilterValue(properties[key])),
  )

/** Sum per value of each group-by key, without any filter. */
type CalculatorValueRanks = Map<string, Map<string, number>>

/**
 * The order of the values of a group: the largest first, measured without the filter over all
 * areas. So a filter never reorders the rows, and every area lists them the same way.
 */
const rankValues = (rows: CalculatorRow[], metric: CalculatorMetric, keys: string[]) => {
  const ranks: CalculatorValueRanks = new Map(keys.map((key) => [key, new Map()]))
  for (const { properties, sums } of rows) {
    const metricValue = sums[metric]
    if (metricValue === undefined) continue
    for (const [key, byValue] of ranks) {
      const filterValue = toFilterValue(properties[key])
      byValue.set(filterValue, (byValue.get(filterValue) ?? 0) + metricValue)
    }
  }
  return ranks
}

const calculateMetricSummary = (
  rows: CalculatorRow[],
  metric: CalculatorMetric,
  groupByKeys: string[],
  filter: CalculatorFilter,
  ranks: CalculatorValueRanks,
) => {
  const sumByGroupByKey = new Map<string, number>()
  const sumByGroupByValue = new Map<string, Map<string, number>>()
  let total = 0

  for (const { properties, sums } of rows) {
    const metricValue = sums[metric]
    if (metricValue === undefined) continue
    if (matchesFilter(properties, filter)) total += metricValue

    for (const groupByKey of groupByKeys) {
      // A group ignores the filter on its own key, so its other values stay there to pick.
      if (!matchesFilter(properties, filter, groupByKey)) continue

      const currentGroupSum = sumByGroupByKey.get(groupByKey) ?? 0
      sumByGroupByKey.set(groupByKey, currentGroupSum + metricValue)

      const byValue = sumByGroupByValue.get(groupByKey) ?? new Map<string, number>()
      const filterValue = toFilterValue(properties[groupByKey])
      const currentValueSum = byValue.get(filterValue) ?? 0
      byValue.set(filterValue, currentValueSum + metricValue)
      sumByGroupByValue.set(groupByKey, byValue)
    }
  }

  // Groups in the order of `groupByKeys`, values in the order of `ranks`: neither follows the
  // filtered sums, so the rows stay where they are when a filter changes.
  const groups = groupByKeys.flatMap((key) => {
    const sum = sumByGroupByKey.get(key)
    if (sum === undefined) return []

    const rank = (filterValue: string) => ranks.get(key)?.get(filterValue) ?? 0
    const values = [...(sumByGroupByValue.get(key)?.entries() ?? [])]
      .map(([filterValue, valueSum]) => ({
        value: filterValue || calculatorMissingGroupValueLabel,
        filterValue,
        sum: valueSum,
        // Share of the group, which is the total unless the group's own key is filtered.
        ratio: toRatio(valueSum, sum),
      }))
      .sort(
        (a, b) =>
          rank(b.filterValue) - rank(a.filterValue) || a.filterValue.localeCompare(b.filterValue),
      )

    return [{ key, sum, ratio: toRatio(sum, total), values }]
  })

  return { total, groups } satisfies CalculatorMetricSummary
}

/**
 * The summary of every drawn area (`areaIds`, also those without a row) and of all areas together.
 * The latter are the rows of the union of the areas, so an overlap is not counted twice.
 */
export const calculateMetricSummaryForAreas = ({
  rows,
  areaIds,
  metric,
  groupByKeys,
  filter = {},
}: {
  rows: CalculatorRow[]
  areaIds: string[]
  metric: CalculatorMetric
  groupByKeys: string[]
  /** Tag values the summed features must have (`sum.filter`). */
  filter?: CalculatorFilter
}) => {
  const rowsOfArea = (area: string) => rows.filter((row) => row.area === area)
  const combinedRows = rowsOfArea(calculatorCombinedAreaId)
  const ranks = rankValues(combinedRows, metric, groupByKeys)

  const byArea = areaIds.map((key) => ({
    key,
    summary: calculateMetricSummary(rowsOfArea(key), metric, groupByKeys, filter, ranks),
  }))

  const combined = calculateMetricSummary(combinedRows, metric, groupByKeys, filter, ranks)

  return { byArea, combined }
}
