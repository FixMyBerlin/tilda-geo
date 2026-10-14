import { FunnelIcon, TrashIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { modePanelTintHairlineTopClassName } from '../modePanel.const'
import {
  type CalculatorDataset,
  type CalculatorMetric,
  calculatorTranslationSourceId,
} from './calculatorDatasets.const'
import { CalculatorGroupValue } from './CalculatorGroupValue'
import type { CalculatorFilter } from './calculatorModeParam'
import type { calculateMetricSummaryForAreas } from './utils/calculateMetricSummaries'
import {
  calculatorStyleOtherColor,
  type CalculatorStyleColors,
} from './utils/calculatorStyleColors'

export type CalculatorDisplayMode = 'value' | 'percent'
type CalculatorSummary = ReturnType<typeof calculateMetricSummaryForAreas>
type CalculatorAreaSummary = CalculatorSummary['byArea'][number]['summary']

/**
 * Everything the breakdown UI needs, computed once in CalculatorResult. Passed as one object
 * to keep call sites tidy.
 */
export type CalculatorBreakdownData = {
  sumKeys: CalculatorDataset['sumKeys']
  /** The sources of the dataset; their translations name the tags and values. */
  parts: CalculatorDataset['parts']
  metrics: CalculatorMetric[]
  selectedMetric: CalculatorMetric | null
  selectedMetricLabel: string
  summary: CalculatorSummary | null
  displayMode: CalculatorDisplayMode
  /** New areas are being summed; the values shown are those of the areas before. */
  isUpdating: boolean
  onSelectMetric: (metric: CalculatorMetric) => void
  onSetDisplayMode: (mode: CalculatorDisplayMode) => void
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
  parts,
  onDelete,
  filter,
  onToggleFilter,
  styleColors,
  formatNumber,
  formatMetricValue,
}: {
  areaSummary: CalculatorAreaSummary
  label: string
  parts: CalculatorDataset['parts']
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
          <TrashIcon className="size-4 text-gray-400 hover:text-gray-700" />
        </button>
      </div>
      <strong className="text-sm tabular-nums">{formatNumber(areaSummary.total)}</strong>
    </div>

    {areaSummary.groups.map((group) => (
      <div key={group.key} className="mb-2 last:mb-0">
        <div className="text-xs font-semibold text-gray-700">
          <ConditionalFormattedKey
            sourceId={calculatorTranslationSourceId(parts, group.key)}
            tagKey={group.key}
          />
        </div>
        {group.values.map((groupValue) => {
          const groupFilter = filter[group.key]
          const selected = groupFilter?.includes(groupValue.filterValue) ?? false
          return (
            <button
              key={`${group.key}::${groupValue.filterValue}`}
              type="button"
              onClick={() => onToggleFilter(group.key, groupValue.filterValue)}
              aria-pressed={selected}
              title={
                selected
                  ? 'Filter entfernen'
                  : groupFilter
                    ? 'Auch diese Werte summieren'
                    : 'Nur diese Werte summieren'
              }
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
                  <CalculatorGroupValue
                    parts={parts}
                    tagKey={group.key}
                    value={groupValue.filterValue}
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
 * The calculator breakdown (metric controls + per-area summaries + combined total). Only
 * rendered once an area is summed.
 * Presentational only — all data/handlers come from CalculatorResult via `data`. Styled for
 * the tinted mode panel (desktop column and mobile dock).
 */
export const CalculatorBreakdown = ({ data }: { data: CalculatorBreakdownData }) => {
  const { summary, selectedMetric, selectedMetricLabel, metrics } = data

  return (
    // While new sums load, the last ones stay in place, faded: nothing in the panel moves.
    <div
      aria-busy={data.isUpdating}
      className={twJoin(
        'min-w-0 text-sm leading-tight transition-opacity',
        data.isUpdating && 'opacity-50',
      )}
    >
      <div className="space-y-2 px-4 py-3">
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
              parts={data.parts}
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
                <span className="tabular-nums">{data.formatNumber(summary.combined.total)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
