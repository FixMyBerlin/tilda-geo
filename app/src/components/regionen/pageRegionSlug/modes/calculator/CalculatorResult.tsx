import bbox from '@turf/bbox'
import { featureCollection } from '@turf/helpers'
import { useMemo, useState } from 'react'
import { IntlProvider } from 'react-intl'
import { useMap } from 'react-map-gl/maplibre'
import {
  useMapBounds,
  useMapCalculatorAreasWithFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useCalculatorAreas } from '@/components/regionen/pageRegionSlug/modes/calculator/useCalculatorAreas'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { modePanelMutedClassName } from '../modePanel.const'
import {
  CalculatorBreakdown,
  type CalculatorBreakdownData,
  type CalculatorDisplayMode,
} from './CalculatorBreakdown'
import type { CalculatorFilter } from './calculatorModeParam'
import type { useCalculatorDatasets } from './useCalculatorDatasets'
import {
  calculateMetricSummaryForAreas,
  calculatorMetricOrder,
} from './utils/calculateMetricSummaries'
import { useCalculatorStyleColors } from './utils/calculatorStyleColors'
import { isDrawAreaFullyInViewport } from './utils/isDrawAreaFullyInViewport'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

type Props = {
  dataset: NonNullable<ReturnType<typeof useCalculatorDatasets>['activeDataset']>
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
}

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Body of the Summieren panel: computes the per-area metric summary from the features that
 * `CalculatorMap` collected and renders it with <CalculatorBreakdown>.
 */
export const CalculatorResult = ({ dataset, filter, onToggleFilter }: Props) => {
  const { sumKeys, groupByKeys, queryLayers, sourceId } = dataset
  const { mainMap } = useMap()
  const calculatorAreasWithFeatures = useMapCalculatorAreasWithFeatures()
  const mapBounds = useMapBounds()
  const styleColors = useCalculatorStyleColors()

  const { drawAreas, setDrawAreas } = useCalculatorAreas()
  const { updateCalculation } = useUpdateCalculation()
  const [preferredMetric, setPreferredMetric] = useState<
    (typeof calculatorMetricOrder)[number] | null
  >(null)
  const [displayMode, setDisplayMode] = useState<CalculatorDisplayMode>('value')

  const orderedConfiguredMetrics = calculatorMetricOrder.filter((metric) => metric in sumKeys)

  const selectedMetric =
    preferredMetric && orderedConfiguredMetrics.includes(preferredMetric)
      ? preferredMetric
      : (orderedConfiguredMetrics[0] ?? null)
  const selectedMetricLabel = selectedMetric ? (sumKeys[selectedMetric] ?? 'Anzahl') : 'Anzahl'
  const formatMetricValue = (sum: number, ratio: number) =>
    displayMode === 'percent' ? percentFormatter.format(ratio) : numberFormatter.format(sum)

  const summary = selectedMetric
    ? calculateMetricSummaryForAreas({
        areas: calculatorAreasWithFeatures,
        metric: selectedMetric,
        groupByKeys,
        filter,
      })
    : null

  const showViewportWarning = useMemo(
    () => drawAreas.some((area) => !isDrawAreaFullyInViewport(area, mapBounds)),
    [drawAreas, mapBounds],
  )

  const handleDelete = (key: string) => {
    const next = drawAreas.filter((a) => a.id !== key)
    setDrawAreas(next)
    updateCalculation(queryLayers, next)
  }

  const handleShowArea = () => {
    if (!mainMap || drawAreas.length === 0) return

    const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection(drawAreas))
    // The camera padding of the mode panel is already set on the map (`modeMapCameraPadding`).
    mainMap.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { duration: 900, padding: 60 },
    )
  }

  // Before the first area the drawing toolbar shows a hint on the map as well.
  if (drawAreas.length === 0 || calculatorAreasWithFeatures.length === 0) {
    return (
      <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
        {drawAreas.length === 0
          ? 'Zeichnen Sie eine Fläche auf der Karte. Die Werte in der Fläche werden hier summiert.'
          : 'Die Werte werden summiert …'}
      </p>
    )
  }

  const breakdownData: CalculatorBreakdownData = {
    sumKeys,
    sourceId,
    metrics: orderedConfiguredMetrics,
    selectedMetric,
    selectedMetricLabel,
    summary,
    displayMode,
    showViewportWarning,
    onSelectMetric: setPreferredMetric,
    onSetDisplayMode: setDisplayMode,
    onShowArea: handleShowArea,
    onDeleteArea: handleDelete,
    filter,
    onToggleFilter,
    styleColors,
    formatNumber: (value) => numberFormatter.format(value),
    formatMetricValue,
  }

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <CalculatorBreakdown data={breakdownData} />
    </IntlProvider>
  )
}
