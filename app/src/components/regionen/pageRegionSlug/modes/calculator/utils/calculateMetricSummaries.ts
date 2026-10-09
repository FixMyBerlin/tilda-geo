import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { z } from 'zod'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'

type CalculatorMetricKey = keyof Extract<MapDataSourceCalculator, { enabled: true }>['sumKeys']

type CalculatorAreaWithFeatures = {
  key: string
  features: MapGeoJSONFeature[]
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

export const calculatorMetricOrder = [
  'capacity',
  'area',
  'length',
] as const satisfies CalculatorMetricKey[]

export const calculatorMissingGroupValueLabel = '(Ohne Angabe)'

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) return parsedValue
  }
  return null
}

const toRatio = (value: number, total: number) => {
  if (total <= 0) return 0
  return value / total
}

/** A tag value as filters compare it: missing and blank values are `''`. */
const toFilterValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const matchesFilter = (
  properties: Record<string, unknown>,
  filter: Record<string, string>,
  exceptKey?: string,
) =>
  Object.entries(filter).every(
    ([key, value]) => key === exceptKey || toFilterValue(properties[key]) === value,
  )

/** Sum per value of each group-by key, without any filter. */
type CalculatorValueRanks = Map<string, Map<string, number>>

/**
 * The order of the values of a group: the largest first, measured without the filter over all
 * areas. So a filter never reorders the rows, and every area lists them the same way.
 */
const rankValues = (features: MapGeoJSONFeature[], metric: CalculatorMetricKey, keys: string[]) => {
  const ranks: CalculatorValueRanks = new Map(keys.map((key) => [key, new Map()]))
  for (const feature of features) {
    const properties = feature.properties ?? {}
    const metricValue = toNumber(properties[metric])
    if (metricValue === null) continue
    for (const [key, byValue] of ranks) {
      const filterValue = toFilterValue(properties[key])
      byValue.set(filterValue, (byValue.get(filterValue) ?? 0) + metricValue)
    }
  }
  return ranks
}

/** Ids are only unique per source, and a dataset may sum several sources. */
const dedupeFeaturesById = (features: MapGeoJSONFeature[]) => {
  const uniqueFeatures = new Map<string, MapGeoJSONFeature>()

  for (const feature of features) {
    if (feature.id === undefined) continue
    uniqueFeatures.set(`${feature.source}--${feature.id}`, feature)
  }

  return [...uniqueFeatures.values()]
}

const flattenFeatures = (areas: CalculatorAreaWithFeatures[]) =>
  dedupeFeaturesById(areas.flatMap((area) => area.features))

const calculateMetricSummary = (
  features: MapGeoJSONFeature[],
  metric: CalculatorMetricKey,
  groupByKeys: string[],
  filter: Record<string, string>,
  ranks: CalculatorValueRanks,
) => {
  const sumByGroupByKey = new Map<string, number>()
  const sumByGroupByValue = new Map<string, Map<string, number>>()
  let total = 0

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const metricValue = toNumber(properties[metric])
    if (metricValue === null) continue
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

export const getAvailableMetricsForAreas = (
  areas: CalculatorAreaWithFeatures[],
  configuredMetrics: CalculatorMetricKey[],
) => {
  const numericMetricValueSchema = z.coerce.number().finite()
  const hasNumericMetricValue = (feature: MapGeoJSONFeature, metric: CalculatorMetricKey) =>
    numericMetricValueSchema.safeParse(feature.properties?.[metric]).success

  const features = flattenFeatures(areas)
  return configuredMetrics.filter((metric) =>
    features.some((feature) => hasNumericMetricValue(feature, metric)),
  )
}

export const calculateMetricSummaryForAreas = ({
  areas,
  metric,
  groupByKeys,
  filter = {},
}: {
  areas: CalculatorAreaWithFeatures[]
  metric: CalculatorMetricKey
  groupByKeys: string[]
  /** Tag values the summed points must have (`sum.filter`). */
  filter?: Record<string, string>
}) => {
  const allFeatures = flattenFeatures(areas)
  const ranks = rankValues(allFeatures, metric, groupByKeys)

  const byArea = areas.map((area) => ({
    key: area.key,
    summary: calculateMetricSummary(
      dedupeFeaturesById(area.features),
      metric,
      groupByKeys,
      filter,
      ranks,
    ),
  }))

  const combined = calculateMetricSummary(allFeatures, metric, groupByKeys, filter, ranks)

  return { byArea, combined }
}
