import bbox from '@turf/bbox'
import { featureCollection } from '@turf/helpers'
import { useMemo, useState } from 'react'
import { IntlProvider } from 'react-intl'
import { useMap } from 'react-map-gl/maplibre'
import {
  useMapBounds,
  useMapCalculatorAreasWithFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useDrawSession } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawSession'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import {
  CalculatorBreakdown,
  type CalculatorBreakdownData,
  type CalculatorDisplayMode,
} from './CalculatorBreakdown'
import { CalculatorMobileSummary } from './CalculatorMobileSummary'
import {
  calculateMetricSummaryForAreas,
  calculatorMetricOrder,
} from './utils/calculateMetricSummaries'
import { isDrawAreaFullyInViewport } from './utils/isDrawAreaFullyInViewport'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

type Props = {
  sumKeys: MapDataSourceCalculator['sumKeys']
  sourceId?: string
  groupByKeys: MapDataSourceCalculator['groupByKeys']
  queryLayers: MapDataSourceCalculator['queryLayers']
  subcategoryName?: string
}

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Calculator output: computes the per-area metric summary, then renders it either as the
 * desktop inline panel or — on mobile — as a compact total pill that opens the breakdown in
 * a bottom sheet. The table itself lives in <CalculatorBreakdown>; the mobile pill + sheet
 * in <CalculatorMobileSummary>.
 */
export const CalculatorOutput = ({
  sumKeys,
  sourceId,
  groupByKeys,
  queryLayers,
  subcategoryName,
}: Props) => {
  const { mainMap } = useMap()
  const calculatorAreasWithFeatures = useMapCalculatorAreasWithFeatures()
  const mapBounds = useMapBounds()
  const displayName = subcategoryName?.replace(/^Summieren: /, '')

  const { drawAreas, setDrawAreas } = useDrawSession()
  const { updateCalculation } = useUpdateCalculation()
  const [preferredMetric, setPreferredMetric] = useState<
    (typeof calculatorMetricOrder)[number] | null
  >(null)
  const [displayMode, setDisplayMode] = useState<CalculatorDisplayMode>('value')
  const isDesktop = useBreakpoint('sm')

  const configuredMetrics = new Set(
    (sumKeys ? Object.keys(sumKeys) : []).map(
      (metric) => metric as (typeof calculatorMetricOrder)[number],
    ),
  )
  const orderedConfiguredMetrics = calculatorMetricOrder.filter((metric) =>
    configuredMetrics.has(metric),
  )

  const selectedMetric =
    preferredMetric && orderedConfiguredMetrics.includes(preferredMetric)
      ? preferredMetric
      : (orderedConfiguredMetrics[0] ?? null)
  const selectedMetricLabel = selectedMetric ? (sumKeys?.[selectedMetric] ?? 'Anzahl') : 'Anzahl'
  const formatMetricValue = (sum: number, ratio: number) =>
    displayMode === 'percent' ? percentFormatter.format(ratio) : numberFormatter.format(sum)

  const summary = selectedMetric
    ? calculateMetricSummaryForAreas({
        areas: calculatorAreasWithFeatures,
        metric: selectedMetric,
        groupByKeys: groupByKeys ?? [],
      })
    : null

  const showViewportWarning = useMemo(
    () => drawAreas.some((area) => !isDrawAreaFullyInViewport(area, mapBounds)),
    [drawAreas, mapBounds],
  )

  const handleDelete = (key: string) => {
    const next = drawAreas.filter((a) => a.id !== key)
    void setDrawAreas(next)
    updateCalculation(queryLayers, next)
  }

  const handleShowArea = () => {
    if (!mainMap || drawAreas.length === 0) return

    const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection(drawAreas))
    mainMap.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { duration: 900, padding: { top: 110, right: 40, bottom: 40, left: 320 } },
    )
  }

  const hasAreas = calculatorAreasWithFeatures.length > 0

  const breakdownData: CalculatorBreakdownData = {
    hasAreas,
    displayName,
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
    formatNumber: (value) => numberFormatter.format(value),
    formatMetricValue,
  }
  const breakdown = <CalculatorBreakdown data={breakdownData} />

  // Headline for the mobile pill: combined across areas, else the single area's total.
  const total =
    summary && hasAreas
      ? summary.byArea.length > 1
        ? summary.combined.total
        : (summary.byArea[0]?.summary.total ?? 0)
      : null

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      {isDesktop ? (
        // Desktop: inline panel next to the sidebar.
        <section className="absolute top-18.75 left-67.5 z-1000 flex min-h-16.25 max-w-65 min-w-0 rounded-md bg-fuchsia-800/90 px-2 py-2 text-white shadow-xl">
          {breakdown}
        </section>
      ) : (
        // Mobile: compact total pill that opens the breakdown in a bottom sheet.
        <CalculatorMobileSummary
          label={hasAreas ? selectedMetricLabel : 'Summierung'}
          total={total !== null ? numberFormatter.format(total) : null}
        >
          {breakdown}
        </CalculatorMobileSummary>
      )}
    </IntlProvider>
  )
}
