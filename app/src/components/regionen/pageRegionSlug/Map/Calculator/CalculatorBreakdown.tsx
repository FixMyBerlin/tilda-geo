import { ArrowUpIcon, TrashIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import {
  calculateMetricSummaryForAreas,
  calculatorMetricOrder,
} from './utils/calculateMetricSummaries'

export type CalculatorDisplayMode = 'value' | 'percent'
type CalculatorMetric = (typeof calculatorMetricOrder)[number]
type CalculatorSummary = ReturnType<typeof calculateMetricSummaryForAreas>
type CalculatorAreaSummary = CalculatorSummary['byArea'][number]['summary']

/**
 * Everything the breakdown UI needs, computed once in CalculatorOutput so the same data
 * backs both the desktop inline panel and the mobile bottom sheet (and the mobile total
 * button). Passed as one object to keep call sites tidy.
 */
export type CalculatorBreakdownData = {
  hasAreas: boolean
  displayName: string | undefined
  sumKeys: MapDataSourceCalculator['sumKeys']
  sourceId: string | undefined
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
  formatNumber: (value: number) => string
  formatMetricValue: (sum: number, ratio: number) => string
}

const toggleClassName = (active: boolean) =>
  twJoin(
    'px-1.5 py-0.5 text-xs leading-tight sm:text-[0.62rem]',
    active ? 'bg-white text-fuchsia-900' : 'text-white/85 hover:bg-white/10',
  )

/** Shown before any area is drawn. */
const CalculatorEmpty = ({ displayName }: { displayName: string | undefined }) => (
  <div className="min-w-0 text-sm leading-tight sm:text-xs">
    <div className="flex items-center gap-1 text-right">
      <ArrowUpIcon className="size-4" />
      <strong>SUMME</strong>
    </div>
    {displayName && (
      <div className="w-full min-w-0 truncate text-xs leading-tight text-white/40 sm:text-[0.6rem]">
        {displayName}
      </div>
    )}
    <div className="mt-1.5 text-white">Flächen zeichnen</div>
  </div>
)

/** Warning that the calculation only covers what's currently in the viewport. */
const ViewportWarning = ({ onShowArea }: { onShowArea: () => void }) => (
  <div className="rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-xs leading-tight text-fuchsia-800 sm:text-[0.66rem]">
    <div className="flex items-start gap-1.5">
      <ExclamationTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-fuchsia-700" />
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
        className="rounded border border-fuchsia-300 px-1.5 py-0.5 text-xs font-semibold text-fuchsia-800 hover:bg-fuchsia-50 sm:text-[0.62rem]"
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
        <div className="inline-flex overflow-hidden rounded border border-white/25">
          {metrics.map((metric) => (
            <button
              key={metric}
              type="button"
              onClick={() => onSelectMetric(metric)}
              className={twJoin(
                'border-r border-white/25 last:border-r-0',
                toggleClassName(selectedMetric === metric),
              )}
            >
              {sumKeys?.[metric] ?? metric}
            </button>
          ))}
        </div>
      )}

      <div className="inline-flex overflow-hidden rounded border border-white/25">
        <button
          type="button"
          onClick={() => onSetDisplayMode('value')}
          className={twJoin('border-r border-white/25', toggleClassName(displayMode === 'value'))}
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
  formatNumber,
  formatMetricValue,
}: {
  areaSummary: CalculatorAreaSummary
  label: string
  sourceId: string | undefined
  onDelete: () => void
  formatNumber: (value: number) => string
  formatMetricValue: (sum: number, ratio: number) => string
}) => (
  <div className="group relative -mx-2 border-t border-white/40 px-2 pt-1.5">
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <strong className="text-sm sm:text-[0.7rem]">{label}</strong>
        <button type="button" onClick={onDelete}>
          <TrashIcon className="size-4 text-white/50 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-white/90" />
        </button>
      </div>
      <strong className="text-sm tabular-nums sm:text-[0.7rem]">
        {formatNumber(areaSummary.total)}
      </strong>
    </div>

    {areaSummary.groups.map((group) => (
      <div key={group.key} className="mb-1 last:mb-0">
        <div className="text-sm font-semibold sm:text-[0.68rem]">
          {sourceId ? (
            <ConditionalFormattedKey sourceId={sourceId} tagKey={group.key} />
          ) : (
            group.key
          )}
        </div>
        {group.values.map((groupValue) => (
          <div
            key={`${group.key}::${groupValue.value}`}
            className="-mr-1 flex min-w-0 justify-between gap-2 rounded-sm py-0.5 pr-1 pl-2 text-xs text-white/90 tabular-nums transition-colors hover:bg-white/10 sm:text-[0.64rem]"
          >
            <span
              className="min-w-0 flex-1 truncate [&_span]:truncate"
              title={groupValue.value.length > 20 ? groupValue.value : undefined}
            >
              {sourceId ? (
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey={group.key}
                  tagValue={groupValue.value}
                />
              ) : (
                groupValue.value
              )}
            </span>
            <span>{formatMetricValue(groupValue.sum, groupValue.ratio)}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
)

/**
 * The calculator breakdown (header + viewport warning + metric controls + per-area
 * summaries + combined total), or the "draw areas" prompt when nothing is drawn yet.
 * Presentational only — all data/handlers come from CalculatorOutput via `data`. Styled
 * white-on-fuchsia so it works in both the desktop panel and the mobile sheet.
 */
export const CalculatorBreakdown = ({ data }: { data: CalculatorBreakdownData }) => {
  if (!data.hasAreas) return <CalculatorEmpty displayName={data.displayName} />

  const { summary, selectedMetric, selectedMetricLabel, metrics } = data

  return (
    <div className="min-w-0 space-y-2 text-sm leading-tight sm:text-xs">
      <div className="min-w-0 text-white/70">
        <div className="font-semibold text-white">SUMMIERUNG</div>
        {data.displayName && (
          <p className="w-full min-w-0 truncate text-xs leading-tight text-white/60 sm:text-[0.6rem]">
            {data.displayName}
          </p>
        )}
      </div>

      {data.showViewportWarning && <ViewportWarning onShowArea={data.onShowArea} />}

      <MetricControls
        metrics={metrics}
        selectedMetric={selectedMetric}
        sumKeys={data.sumKeys}
        displayMode={data.displayMode}
        onSelectMetric={data.onSelectMetric}
        onSetDisplayMode={data.onSetDisplayMode}
      />

      {!selectedMetric || !summary ? (
        <div className="text-sm text-white/90 sm:text-[0.7rem]">
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
              formatNumber={data.formatNumber}
              formatMetricValue={data.formatMetricValue}
            />
          ))}

          {summary.byArea.length > 1 && (
            <div className="-mx-2 mt-1 border-t border-white/70 px-2 pt-1.5 text-sm font-semibold sm:text-[0.72rem]">
              <div className="flex items-center justify-between gap-2">
                <span>{selectedMetricLabel} Kombiniert</span>
                <span className="tabular-nums">{data.formatNumber(summary.combined.total)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
