import type { ExpressionSpecification } from 'maplibre-gl'
import { useMapCalculatorAreasWithFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useCalculatorDatasets } from '../useCalculatorDatasets'
import { calculateMetricSummaryForAreas, calculatorMetricOrder } from './calculateMetricSummaries'

/** Told apart on the map and on the tinted panel; in this order for the largest values. */
const stylePalette = [
  '#2563eb',
  '#ea580c',
  '#16a34a',
  '#dc2626',
  '#ca8a04',
  '#0891b2',
  '#db2777',
  '#4d7c0f',
]

/** Values beyond the palette, and points with a value that is not in the areas. */
export const calculatorStyleOtherColor = '#6b7280'

export type CalculatorStyleColors = {
  /** The tag the points are colored by (`sum.style`). */
  key: string
  /** Color per value as filters store it (`''` for a missing value). */
  colors: Record<string, string>
}

/** One color per value of the styled tag, the largest values first. */
export const buildCalculatorStyleColors = (key: string, filterValues: string[]) =>
  ({
    key,
    colors: Object.fromEntries(
      filterValues.map((value, index) => [value, stylePalette[index] ?? calculatorStyleOtherColor]),
    ),
  }) satisfies CalculatorStyleColors

/** `circle-color` for the points; compares like `toFilterValue` (missing or empty is `''`). */
export const calculatorStyleColorExpression = ({ key, colors }: CalculatorStyleColors) => {
  const pairs = Object.entries(colors).flat()
  if (pairs.length === 0) return undefined
  return [
    'match',
    ['to-string', ['coalesce', ['get', key], '']],
    ...pairs,
    calculatorStyleOtherColor,
  ] as ExpressionSpecification
}

/**
 * The colors of the active style, shared by the map (points) and the panel (dots in the
 * breakdown, which is the legend). `undefined` without a style or before an area is summed.
 *
 * The values are ranked by the first metric of the dataset over all areas, with the filter
 * applied to the other tags, so the colors do not change with the metric shown in the panel.
 */
export const useCalculatorStyleColors = () => {
  const { activeDataset, filter, style } = useCalculatorDatasets()
  const areas = useMapCalculatorAreasWithFeatures()
  if (!activeDataset || !style || areas.length === 0) return undefined

  const metric = calculatorMetricOrder.find((candidate) => candidate in activeDataset.sumKeys)
  if (!metric) return undefined

  const { combined } = calculateMetricSummaryForAreas({
    areas,
    metric,
    groupByKeys: [style],
    filter,
  })
  const values = combined.groups[0]?.values.map((value) => value.filterValue) ?? []
  return buildCalculatorStyleColors(style, values)
}
