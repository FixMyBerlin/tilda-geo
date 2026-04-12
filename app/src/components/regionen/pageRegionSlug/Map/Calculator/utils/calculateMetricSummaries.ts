import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { z } from 'zod'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'

type CalculatorMetricKey = keyof Extract<MapDataSourceCalculator, { enabled: true }>['sumKeys']

type CalculatorAreaWithFeatures = {
  key: string
  features: MapGeoJSONFeature[]
}

type CalculatorGroupValueSummary = {
  value: string
  sum: number
  ratio: number
}

type CalculatorGroupSummary = {
  key: string
  sum: number
  ratio: number
  values: CalculatorGroupValueSummary[]
}

export type CalculatorMetricSummary = {
  total: number
  groups: CalculatorGroupSummary[]
}

export const calculatorMetricOrder = [
  'capacity',
  'area',
  'length',
] as const satisfies CalculatorMetricKey[]

const missingGroupValueLabel = '(Ohne Angabe)'

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

const toGroupValueLabel = (value: unknown) => {
  if (value === null || value === undefined) return missingGroupValueLabel
  if (typeof value === 'string') return value.trim() || missingGroupValueLabel
  return String(value)
}

const sortBySumDesc = <T extends { sum: number }>(items: T[]) =>
  [...items].sort((a, b) => b.sum - a.sum)

const dedupeFeaturesById = (features: MapGeoJSONFeature[]) => {
  const uniqueFeatures = new Map<string | number, MapGeoJSONFeature>()

  for (const feature of features) {
    if (feature.id === undefined) continue
    uniqueFeatures.set(feature.id, feature)
  }

  return [...uniqueFeatures.values()]
}

const flattenFeatures = (areas: CalculatorAreaWithFeatures[]) =>
  dedupeFeaturesById(areas.flatMap((area) => area.features))

const calculateMetricSummary = (
  features: MapGeoJSONFeature[],
  metric: CalculatorMetricKey,
  groupByKeys: string[],
) => {
  const sumByGroupByKey = new Map<string, number>()
  const sumByGroupByValue = new Map<string, Map<string, number>>()
  let total = 0

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const metricValue = toNumber(properties[metric])
    if (metricValue === null) continue
    total += metricValue

    for (const groupByKey of groupByKeys) {
      const currentGroupSum = sumByGroupByKey.get(groupByKey) ?? 0
      sumByGroupByKey.set(groupByKey, currentGroupSum + metricValue)

      const byValue = sumByGroupByValue.get(groupByKey) ?? new Map<string, number>()
      const groupValueLabel = toGroupValueLabel(properties[groupByKey])
      const currentValueSum = byValue.get(groupValueLabel) ?? 0
      byValue.set(groupValueLabel, currentValueSum + metricValue)
      sumByGroupByValue.set(groupByKey, byValue)
    }
  }

  const groups = sortBySumDesc(
    [...sumByGroupByKey.entries()].map(([key, sum]) => {
      const values = sortBySumDesc(
        [...(sumByGroupByValue.get(key)?.entries() ?? [])].map(([value, valueSum]) => ({
          value,
          sum: valueSum,
          ratio: toRatio(valueSum, total),
        })),
      )

      return {
        key,
        sum,
        ratio: toRatio(sum, total),
        values,
      }
    }),
  )

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
}: {
  areas: CalculatorAreaWithFeatures[]
  metric: CalculatorMetricKey
  groupByKeys: string[]
}) => {
  const byArea = areas.map((area) => ({
    key: area.key,
    summary: calculateMetricSummary(dedupeFeaturesById(area.features), metric, groupByKeys),
  }))

  const combined = calculateMetricSummary(flattenFeatures(areas), metric, groupByKeys)

  return { byArea, combined }
}
