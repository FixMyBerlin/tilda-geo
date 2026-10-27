import { useState } from 'react'
import { IntlProvider } from 'react-intl'
import { useCalculatorAreas } from '@/components/regionen/pageRegionSlug/modes/calculator/useCalculatorAreas'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { modePanelMutedClassName } from '../modePanel.const'
import {
  CalculatorBreakdown,
  type CalculatorBreakdownData,
  type CalculatorDisplayMode,
} from './CalculatorBreakdown'
import { calculatorMetricOrder } from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { useCalculatorDraw } from './drawing/useCalculatorDraw'
import type { useCalculatorDatasets } from './useCalculatorDatasets'
import { useCalculatorQuery } from './useCalculatorQuery'
import {
  type CalculatorColumn,
  calculateMetricSummaryForAreas,
} from './utils/calculateMetricSummaries'
import { useCalculatorStyleColors } from './utils/calculatorStyleColors'
import { roundCapacity } from './utils/roundCapacity'

type Props = {
  dataset: NonNullable<ReturnType<typeof useCalculatorDatasets>['activeDataset']>
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
}

const wholeNumber = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const kilometers = new Intl.NumberFormat('de-DE', {
  style: 'unit',
  unit: 'kilometer',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
/** An amount as the panel shows it, with its unit. Lengths are meters in the data. */
const formatAmount = (column: CalculatorColumn, value: number) => {
  switch (column) {
    case 'length_directions':
      return kilometers.format(value / 1000)
    case 'area':
      return `${wholeNumber.format(value)} m²`
    case 'objects':
    case 'missing':
      return wholeNumber.format(value)
    case 'capacity':
      return wholeNumber.format(roundCapacity(value))
  }
}
const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Body of the Summieren panel: computes the per-area metric summary from the rows of the server
 * (`useCalculatorQuery`) and renders it with <CalculatorBreakdown>.
 */
export const CalculatorResult = ({ dataset, filter, onToggleFilter }: Props) => {
  const { sumKeys, groupByKeys, parts } = dataset
  const { data, isPlaceholderData, isError } = useCalculatorQuery()
  const styleColors = useCalculatorStyleColors()

  const { drawAreas } = useCalculatorAreas()
  const draw = useCalculatorDraw()
  const [displayMode, setDisplayMode] = useState<CalculatorDisplayMode>('value')

  const metrics = calculatorMetricOrder.filter((metric) => metric in sumKeys)
  const [firstMetric] = metrics

  const summary = data
    ? calculateMetricSummaryForAreas({
        rows: data.rows,
        areaIds: drawAreas.map((area) => area.id),
        metrics,
        groupByKeys,
        filter,
      })
    : null

  const handleDelete = (key: string) => {
    // Through the drawing surface, so a deleted area can be brought back with undo.
    draw.replace(drawAreas.filter((a) => a.id !== key))
  }

  // Before the first area the drawing toolbar shows a hint on the map as well.
  const message =
    drawAreas.length === 0
      ? 'Zeichnen Sie eine Fläche auf der Karte. Die Werte in der Fläche werden hier summiert.'
      : isError
        ? 'Die Werte konnten nicht summiert werden. Bitte versuchen Sie es später erneut.'
        : !data
          ? 'Die Werte werden summiert …'
          : data.status === 'timeout'
            ? 'Die Fläche ist zu groß: Das Summieren hat zu lange gedauert. Bitte zeichnen Sie eine kleinere Fläche.'
            : undefined
  if (message) {
    return <p className={`px-4 py-3 ${modePanelMutedClassName}`}>{message}</p>
  }

  const breakdownData: CalculatorBreakdownData = {
    parts,
    summary,
    columnLabel: (column) => (column === 'missing' ? 'ohne Angabe' : (sumKeys[column] ?? column)),
    columnTitle: (column) =>
      column === 'missing' && firstMetric
        ? `Ohne Wert für „${sumKeys[firstMetric]}“, darin nicht enthalten`
        : undefined,
    displayMode,
    isUpdating: isPlaceholderData,
    onSetDisplayMode: setDisplayMode,
    onDeleteArea: handleDelete,
    filter,
    onToggleFilter,
    styleColors,
    formatAmount,
    formatValue: (column, value, ratio) =>
      displayMode === 'percent' ? percentFormatter.format(ratio) : formatAmount(column, value),
  }

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <CalculatorBreakdown data={breakdownData} />
    </IntlProvider>
  )
}
