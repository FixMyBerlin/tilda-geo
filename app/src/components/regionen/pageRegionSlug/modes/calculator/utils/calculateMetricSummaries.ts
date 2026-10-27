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
  /** Per metric, the number of features without a value; they are not in `sums`. */
  missing?: Partial<Record<CalculatorMetric, number>>
}

/**
 * A column of the panel: a metric of the dataset, or `missing`, the number of features without a
 * value for the first metric.
 */
export type CalculatorColumn = CalculatorMetric | 'missing'

/** One amount per column; a column without a value has none. */
export type CalculatorAmounts = Partial<Record<CalculatorColumn, number>>

type CalculatorGroupValueSummary = {
  /** Display value; a missing value is `(Ohne Angabe)`. */
  value: string
  /** The value as a filter stores it; a missing value is `''`. */
  filterValue: string
  amounts: CalculatorAmounts
  /** Per column, the share of the group, which is the total unless the group's own key is filtered. */
  ratios: CalculatorAmounts
}

type CalculatorGroupSummary = {
  key: string
  values: CalculatorGroupValueSummary[]
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

const addAmounts = (target: CalculatorAmounts, amounts: CalculatorAmounts) => {
  for (const [column, value] of Object.entries(amounts) as [CalculatorColumn, number][]) {
    target[column] = (target[column] ?? 0) + value
  }
}

/** The amounts of a row in the columns of the panel. */
const rowAmounts = ({ sums, missing }: CalculatorRow, columns: CalculatorColumn[]) => {
  const amounts: CalculatorAmounts = {}
  for (const column of columns) {
    // `missing` counts the features without the first column, which is always a metric.
    const value = column === 'missing' ? missing?.[columns[0] as CalculatorMetric] : sums[column]
    if (value !== undefined) amounts[column] = value
  }
  return amounts
}

/** Amounts per value of each group-by key, without any filter. */
type CalculatorValueRanks = Map<string, Map<string, CalculatorAmounts>>

/**
 * The order of the values of a group: the largest first by the first column, then the next, measured
 * without the filter over all areas. So a filter never reorders the rows, and every area lists them
 * the same way.
 */
const rankValues = (rows: CalculatorRow[], columns: CalculatorColumn[], keys: string[]) => {
  const ranks: CalculatorValueRanks = new Map(keys.map((key) => [key, new Map()]))
  for (const row of rows) {
    const amounts = rowAmounts(row, columns)
    for (const [key, byValue] of ranks) {
      const filterValue = toFilterValue(row.properties[key])
      const rank = byValue.get(filterValue) ?? {}
      addAmounts(rank, amounts)
      byValue.set(filterValue, rank)
    }
  }
  return ranks
}

const compareRanks = (columns: CalculatorColumn[], a: CalculatorAmounts, b: CalculatorAmounts) => {
  for (const column of columns) {
    const difference = (b[column] ?? 0) - (a[column] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

const calculateSummary = (
  rows: CalculatorRow[],
  columns: CalculatorColumn[],
  groupByKeys: string[],
  filter: CalculatorFilter,
  ranks: CalculatorValueRanks,
) => {
  const totals: CalculatorAmounts = {}
  const groupAmounts = new Map(groupByKeys.map((key) => [key, {} as CalculatorAmounts]))
  const valueAmounts = new Map(
    groupByKeys.map((key) => [key, new Map<string, CalculatorAmounts>()]),
  )

  for (const row of rows) {
    const amounts = rowAmounts(row, columns)
    // Only summed by a metric the dataset does not show.
    if (Object.keys(amounts).length === 0) continue
    if (matchesFilter(row.properties, filter)) addAmounts(totals, amounts)

    for (const groupByKey of groupByKeys) {
      // A group ignores the filter on its own key, so its other values stay there to pick.
      if (!matchesFilter(row.properties, filter, groupByKey)) continue

      addAmounts(groupAmounts.get(groupByKey) ?? {}, amounts)
      const byValue = valueAmounts.get(groupByKey) ?? new Map<string, CalculatorAmounts>()
      const filterValue = toFilterValue(row.properties[groupByKey])
      const valueSum = byValue.get(filterValue) ?? {}
      addAmounts(valueSum, amounts)
      byValue.set(filterValue, valueSum)
    }
  }

  // Groups in the order of `groupByKeys`, values in the order of `ranks`: neither follows the
  // filtered sums, so the rows stay where they are when a filter changes.
  const groups = groupByKeys.flatMap((key) => {
    const byValue = valueAmounts.get(key)
    if (!byValue?.size) return []

    const groupSum = groupAmounts.get(key) ?? {}
    const rank = (filterValue: string) => ranks.get(key)?.get(filterValue) ?? {}
    const values = [...byValue.entries()]
      .map(([filterValue, amounts]) => ({
        value: filterValue || calculatorMissingGroupValueLabel,
        filterValue,
        amounts,
        ratios: Object.fromEntries(
          Object.entries(amounts).map(([column, value]) => [
            column,
            toRatio(value, groupSum[column as CalculatorColumn] ?? 0),
          ]),
        ),
      }))
      .sort(
        (a, b) =>
          compareRanks(columns, rank(a.filterValue), rank(b.filterValue)) ||
          a.filterValue.localeCompare(b.filterValue),
      )

    return [{ key, values } satisfies CalculatorGroupSummary]
  })

  return { totals, groups }
}

/**
 * The summary of every drawn area (`areaIds`, also those without a row) and of all areas together.
 * The latter are the rows of the union of the areas, so an overlap is not counted twice.
 *
 * Every metric is a column. When features lack a value for the first metric, a `missing` column
 * counts them: they are in the other columns, but not in the first.
 */
export const calculateMetricSummaryForAreas = ({
  rows,
  areaIds,
  metrics,
  groupByKeys,
  filter = {},
}: {
  rows: CalculatorRow[]
  areaIds: string[]
  /** The metrics of the dataset in the order of the columns. */
  metrics: CalculatorMetric[]
  groupByKeys: string[]
  /** Tag values the summed features must have (`sum.filter`). */
  filter?: CalculatorFilter
}) => {
  const [firstMetric] = metrics
  const hasMissing = rows.some((row) => firstMetric && row.missing?.[firstMetric])
  const columns: CalculatorColumn[] = hasMissing ? [...metrics, 'missing'] : metrics

  const rowsOfArea = (area: string) => rows.filter((row) => row.area === area)
  const combinedRows = rowsOfArea(calculatorCombinedAreaId)
  const ranks = rankValues(combinedRows, columns, groupByKeys)

  const byArea = areaIds.map((key) => ({
    key,
    summary: calculateSummary(rowsOfArea(key), columns, groupByKeys, filter, ranks),
  }))

  const combined = calculateSummary(combinedRows, columns, groupByKeys, filter, ranks)

  return { columns, byArea, combined }
}
