import { ArrowUpIcon, TrashIcon } from '@heroicons/react/20/solid'
import { useMemo, useState } from 'react'
import { IntlProvider } from 'react-intl'
import { twJoin } from 'tailwind-merge'
import { useMapCalculatorAreasWithFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useDrawSession } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawSession'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import {
  calculateMetricSummaryForAreas,
  calculatorMetricOrder,
} from './utils/calculateMetricSummaries'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

type Props = {
  sumKeys: MapDataSourceCalculator['sumKeys']
  sourceId?: string
  groupByKeys: MapDataSourceCalculator['groupByKeys']
  queryLayers: MapDataSourceCalculator['queryLayers']
  subcategoryName?: string
}
type DisplayMode = 'value' | 'percent'

const numberFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 1,
})
const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const CalculatorOutput = ({
  sumKeys,
  sourceId,
  groupByKeys,
  queryLayers,
  subcategoryName,
}: Props) => {
  const calculatorAreasWithFeatures = useMapCalculatorAreasWithFeatures()
  const displayName = subcategoryName?.replace(/^Summieren: /, '')

  const { drawAreas, setDrawAreas } = useDrawSession()
  const { updateCalculation } = useUpdateCalculation()
  const [preferredMetric, setPreferredMetric] = useState<
    (typeof calculatorMetricOrder)[number] | null
  >(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('value')

  const configuredMetricEntries = sumKeys ? Object.entries(sumKeys) : []
  const configuredMetrics = new Set(
    configuredMetricEntries.map(([metric]) => metric as (typeof calculatorMetricOrder)[number]),
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

  const summary = useMemo(() => {
    if (!selectedMetric) return null
    return calculateMetricSummaryForAreas({
      areas: calculatorAreasWithFeatures,
      metric: selectedMetric,
      groupByKeys: groupByKeys ?? [],
    })
  }, [calculatorAreasWithFeatures, groupByKeys, selectedMetric])

  const handleDelete = (key: string) => {
    const next = drawAreas.filter((a) => a.id !== key)
    void setDrawAreas(next)
    updateCalculation(queryLayers, next)
  }

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <section
        className={twJoin(
          'absolute z-1000 flex min-w-0 rounded-md bg-fuchsia-800/90 px-2 py-2 text-white shadow-xl',
        )}
        style={{
          left: '270px',
          top: '75px',
          minHeight: '65px',
          maxWidth: '360px',
        }}
      >
        {calculatorAreasWithFeatures.length ? (
          <div className="min-w-0 space-y-2 text-xs leading-tight">
            <div className="min-w-0 text-white/70">
              <div className="font-semibold text-white">SUMMIERUNG</div>
              {displayName && (
                <p className="w-full min-w-0 truncate text-[0.6rem] leading-tight text-white/60">
                  {displayName}
                </p>
              )}
            </div>

            {orderedConfiguredMetrics.length > 0 && (
              <div
                className={twJoin(
                  'flex items-center',
                  orderedConfiguredMetrics.length > 1 ? 'justify-between gap-2' : 'justify-end',
                )}
              >
                {orderedConfiguredMetrics.length > 1 && (
                  <div className="inline-flex overflow-hidden rounded border border-white/25">
                    {orderedConfiguredMetrics.map((metric) => {
                      const isActive = selectedMetric === metric
                      return (
                        <button
                          key={metric}
                          type="button"
                          onClick={() => setPreferredMetric(metric)}
                          className={twJoin(
                            'border-r border-white/25 px-1.5 py-0.5 text-[0.62rem] leading-tight last:border-r-0',
                            isActive
                              ? 'bg-white text-fuchsia-900'
                              : 'text-white/85 hover:bg-white/10',
                          )}
                        >
                          {sumKeys?.[metric] ?? metric}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="inline-flex overflow-hidden rounded border border-white/25">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('value')}
                    className={twJoin(
                      'border-r border-white/25 px-1.5 py-0.5 text-[0.62rem] leading-tight',
                      displayMode === 'value'
                        ? 'bg-white text-fuchsia-900'
                        : 'text-white/85 hover:bg-white/10',
                    )}
                    aria-label="Zahlenansicht"
                  >
                    #
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('percent')}
                    className={twJoin(
                      'px-1.5 py-0.5 text-[0.62rem] leading-tight',
                      displayMode === 'percent'
                        ? 'bg-white text-fuchsia-900'
                        : 'text-white/85 hover:bg-white/10',
                    )}
                    aria-label="Prozentansicht"
                  >
                    %
                  </button>
                </div>
              </div>
            )}

            {!selectedMetric || !summary ? (
              <div className="text-[0.7rem] text-white/90">
                Keine Werte für {orderedConfiguredMetrics.join(' / ') || 'Metriken'} gefunden
              </div>
            ) : (
              <>
                {summary.byArea.map(({ key, summary: areaSummary }, index) => (
                  <div
                    key={key}
                    className="group relative -mx-2 border-t border-white/40 px-2 pt-1.5"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <strong className="text-[0.7rem]">
                          {selectedMetricLabel}
                          {summary.byArea.length > 1 ? ` Fläche ${index + 1}` : ''}
                        </strong>
                        <button type="button" onClick={() => handleDelete(key)}>
                          <TrashIcon className="size-4 text-white/50 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-white/90" />
                        </button>
                      </div>
                      <strong className="text-[0.7rem] tabular-nums">
                        {numberFormatter.format(areaSummary.total)}
                      </strong>
                    </div>

                    {areaSummary.groups.map((group) => (
                      <div key={group.key} className="mb-1 last:mb-0">
                        <div className="text-[0.68rem] font-semibold">
                          <span>
                            {sourceId ? (
                              <ConditionalFormattedKey sourceId={sourceId} tagKey={group.key} />
                            ) : (
                              group.key
                            )}
                          </span>
                        </div>
                        {group.values.map((groupValue) => (
                          <div
                            key={`${group.key}::${groupValue.value}`}
                            className="flex justify-between gap-2 pl-2 text-[0.64rem] text-white/90 tabular-nums"
                          >
                            <span>
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
                ))}

                {summary.byArea.length > 1 && (
                  <div className="-mx-2 mt-1 border-t border-white/70 px-2 pt-1.5 text-[0.72rem] font-semibold">
                    <div className="flex items-center justify-between gap-2">
                      <span>{selectedMetricLabel} Kombiniert</span>
                      <span className="tabular-nums">
                        {numberFormatter.format(summary.combined.total)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="min-w-0 text-xs leading-tight">
            <div className="flex items-center gap-1 text-right">
              <ArrowUpIcon className="size-4" />
              <strong>SUMME</strong>
            </div>
            {displayName && (
              <div className="w-full min-w-0 truncate text-[0.6rem] leading-tight text-white/40">
                {displayName}
              </div>
            )}
            <div className="mt-1.5 text-white">Flächen zeichnen</div>
          </div>
        )}
      </section>
    </IntlProvider>
  )
}
