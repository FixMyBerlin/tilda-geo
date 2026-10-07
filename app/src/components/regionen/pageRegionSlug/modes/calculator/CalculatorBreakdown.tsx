import { FunnelIcon, TrashIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import { AnimatedNumber } from '@/components/shared/motion/AnimatedNumber'
import { modePanelTintHairlineTopClassName } from '../modePanel.const'
import type { CalculatorFilter } from './calculatorModeParam'
import {
  calculateMetricSummaryForAreas,
  calculatorMetricOrder,
} from './utils/calculateMetricSummaries'
import {
  calculatorStyleOtherColor,
  type CalculatorStyleColors,
} from './utils/calculatorStyleColors'

export type CalculatorDisplayMode = 'value' | 'percent'
type CalculatorMetric = (typeof calculatorMetricOrder)[number]
type CalculatorSummary = ReturnType<typeof calculateMetricSummaryForAreas>
type CalculatorAreaSummary = CalculatorSummary['byArea'][number]['summary']

/**
 * Everything the breakdown UI needs, computed once in CalculatorResult. Passed as one object
 * to keep call sites tidy.
 */
export type CalculatorBreakdownData = {
  sumKeys: NonNullable<MapDataSourceCalculator['sumKeys']>
  sourceId: string
  metrics: CalculatorMetric[]
  selectedMetric: CalculatorMetric | null
  selectedMetricLabel: string
  summary: CalculatorSummary | null
  displayMode: CalculatorDisplayMode
  showViewportWarning: boolean
  onSelectMetric: (metric: CalculatorMetric) => void
  onSetDisplayMode: (mode: CalculatorDisplayMode) => void
  onShowArea: () => void
  onDeleteArea: (key: string) => void
  /** Tag values the sum is narrowed to (`sum.filter`). */
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
  /** Colors of the active style: its group shows them as dots, which is the legend of the map. */
  styleColors: CalculatorStyleColors | undefined
  formatNumber: (value: number) => string
  formatMetricValue: (sum: number, ratio: number) => string
}

const toggleClassName = (active: boolean) =>
  twJoin(
    'px-2 py-1 text-xs leading-tight',
    active ? 'bg-fuchsia-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
  )

/** Warning that the calculation only covers what's currently in the viewport. */
const ViewportWarning = ({ onShowArea }: { onShowArea: () => void }) => (
  <div className="rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-xs leading-snug text-fuchsia-800">
    <div className="flex items-start gap-1.5">
      <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-fuchsia-700" />
      <p>
        Die Berechnung basiert auf sichtbaren Kartendaten. Bitte stellen Sie sicher, dass die
        gesamte Fläche sichtbar ist, um genaue Ergebnisse zu erhalten.
      </p>
    </div>
    <div className="mt-1.5 flex justify-end">
      <button
        type="button"
        onClick={onShowArea}
        aria-label="Gesamte Zeichenfläche in der Karte anzeigen"
        className="rounded border border-fuchsia-300 px-1.5 py-0.5 text-xs font-semibold text-fuchsia-800 hover:bg-fuchsia-50"
      >
        Fläche anzeigen
      </button>
    </div>
  </div>
)

/** Metric selector (when >1 metric) + value/percent display-mode toggle. */
const MetricControls = ({
  metrics,
  selectedMetric,
  sumKeys,
  displayMode,
  onSelectMetric,
  onSetDisplayMode,
}: Pick<
  CalculatorBreakdownData,
  'metrics' | 'selectedMetric' | 'sumKeys' | 'displayMode' | 'onSelectMetric' | 'onSetDisplayMode'
>) => {
  if (metrics.length === 0) return null

  return (
    <div
      className={twJoin(
        'flex items-center',
        metrics.length > 1 ? 'justify-between gap-2' : 'justify-end',
      )}
    >
      {metrics.length > 1 && (
        <div className="inline-flex overflow-hidden rounded border border-gray-300">
          {metrics.map((metric) => (
            <button
              key={metric}
              type="button"
              onClick={() => onSelectMetric(metric)}
              className={twJoin(
                'border-r border-gray-300 last:border-r-0',
                toggleClassName(selectedMetric === metric),
              )}
            >
              {sumKeys[metric] ?? metric}
            </button>
          ))}
        </div>
      )}

      <div className="inline-flex overflow-hidden rounded border border-gray-300">
        <button
          type="button"
          onClick={() => onSetDisplayMode('value')}
          className={twJoin('border-r border-gray-300', toggleClassName(displayMode === 'value'))}
          aria-label="Zahlenansicht"
        >
          #
        </button>
        <button
          type="button"
          onClick={() => onSetDisplayMode('percent')}
          className={toggleClassName(displayMode === 'percent')}
          aria-label="Prozentansicht"
        >
          %
        </button>
      </div>
    </div>
  )
}

/** One drawn area: its total + the grouped per-value rows. */
const AreaSummary = ({
  areaSummary,
  label,
  sourceId,
  onDelete,
  filter,
  onToggleFilter,
  styleColors,
  formatNumber,
  formatMetricValue,
}: {
  areaSummary: CalculatorAreaSummary
  label: string
  sourceId: string
  onDelete: () => void
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
  styleColors: CalculatorStyleColors | undefined
  formatNumber: (value: number) => string
  formatMetricValue: (sum: number, ratio: number) => string
}) => (
  <div className={twJoin('group px-4 py-3', modePanelTintHairlineTopClassName)}>
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <strong className="text-sm">{label}</strong>
        <button type="button" onClick={onDelete} aria-label="Fläche löschen" title="Fläche löschen">
          <TrashIcon className="size-4 text-gray-400 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-gray-700 pointer-coarse:opacity-100" />
        </button>
      </div>
      <strong className="text-sm tabular-nums">
        <AnimatedNumber value={areaSummary.total} format={formatNumber} />
      </strong>
    </div>

    {areaSummary.groups.map((group) => (
      <div key={group.key} className="mb-2 last:mb-0">
        <div className="text-xs font-semibold text-gray-700">
          <ConditionalFormattedKey sourceId={sourceId} tagKey={group.key} />
        </div>
        {group.values.map((groupValue) => {
          const groupFilter = filter[group.key]
          const selected = groupFilter === groupValue.filterValue
          return (
            <button
              key={`${group.key}::${groupValue.filterValue}`}
              type="button"
              onClick={() => onToggleFilter(group.key, groupValue.filterValue)}
              aria-pressed={selected}
              title={selected ? 'Filter entfernen' : 'Nur diese Werte summieren'}
              className={twJoin(
                'group/row -mr-1 flex w-[calc(100%+0.25rem)] min-w-0 cursor-pointer justify-between gap-2 rounded-sm py-0.5 pr-1 pl-2 text-left text-xs tabular-nums transition-colors',
                selected
                  ? 'bg-white font-semibold text-fuchsia-800'
                  : 'text-gray-600 hover:bg-white/60',
                // The other values of a filtered tag are not part of the sum.
                groupFilter !== undefined && !selected ? 'opacity-50 hover:opacity-100' : '',
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                {styleColors?.key === group.key && (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        styleColors.colors[groupValue.filterValue] ?? calculatorStyleOtherColor,
                    }}
                  />
                )}
                <span
                  className="min-w-0 truncate [&_span]:truncate"
                  title={groupValue.value.length > 20 ? groupValue.value : undefined}
                >
                  <ConditionalFormattedValue
                    sourceId={sourceId}
                    tagKey={group.key}
                    tagValue={groupValue.value}
                  />
                </span>
                {/* What a click does: add or remove the filter. */}
                <span
                  aria-hidden
                  className="hidden shrink-0 items-center font-semibold text-fuchsia-700 group-hover/row:inline-flex group-focus-visible/row:inline-flex"
                >
                  {selected ? '−' : '+'}
                  <FunnelIcon className="size-3" />
                </span>
              </span>
              <span>{formatMetricValue(groupValue.sum, groupValue.ratio)}</span>
            </button>
          )
        })}
      </div>
    ))}
  </div>
)

/**
 * The calculator breakdown (viewport warning + metric controls + per-area summaries +
 * combined total). Only rendered once an area is drawn.
 * Presentational only — all data/handlers come from CalculatorResult via `data`. Styled for
 * the tinted mode panel (desktop column and mobile dock).
 */
export const CalculatorBreakdown = ({ data }: { data: CalculatorBreakdownData }) => {
  const { summary, selectedMetric, selectedMetricLabel, metrics } = data

  return (
    <div className="min-w-0 text-sm leading-tight">
      <div className="space-y-2 px-4 py-3">
        {data.showViewportWarning && <ViewportWarning onShowArea={data.onShowArea} />}

        <MetricControls
          metrics={metrics}
          selectedMetric={selectedMetric}
          sumKeys={data.sumKeys}
          displayMode={data.displayMode}
          onSelectMetric={data.onSelectMetric}
          onSetDisplayMode={data.onSetDisplayMode}
        />
      </div>

      {!selectedMetric || !summary ? (
        <div className={twJoin('px-4 py-3 text-gray-600', modePanelTintHairlineTopClassName)}>
          Keine Werte für {metrics.join(' / ') || 'Metriken'} gefunden
        </div>
      ) : (
        <>
          {summary.byArea.map(({ key, summary: areaSummary }, index) => (
            <AreaSummary
              key={key}
              areaSummary={areaSummary}
              label={`${selectedMetricLabel}${summary.byArea.length > 1 ? ` Fläche ${index + 1}` : ''}`}
              sourceId={data.sourceId}
              onDelete={() => data.onDeleteArea(key)}
              filter={data.filter}
              styleColors={data.styleColors}
              onToggleFilter={data.onToggleFilter}
              formatNumber={data.formatNumber}
              formatMetricValue={data.formatMetricValue}
            />
          ))}

          {summary.byArea.length > 1 && (
            <div
              className={twJoin(
                'px-4 py-3 text-sm font-semibold',
                modePanelTintHairlineTopClassName,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{selectedMetricLabel} Kombiniert</span>
                <span className="tabular-nums">
                  <AnimatedNumber value={summary.combined.total} format={data.formatNumber} />
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
