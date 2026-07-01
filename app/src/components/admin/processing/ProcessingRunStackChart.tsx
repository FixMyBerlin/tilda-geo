import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import type { TopicId } from '@/data/processingTypes/topicId.generated.const'
import {
  buildAreaLayers,
  buildChartColumns,
  buildStackedAreaPath,
  chartHasTimingData,
  formatDurationMs,
  getChartColumnTotalMs,
  getMaxChartDurationMs,
  partitionChartColumnsByTiming,
  type ChartRunColumn,
} from '@/server/processing/parseTopicTimings'
import type { ChartPhaseFilter } from '@/server/processing/parseTopicTimings'
import type { ProcessingRunRow } from '@/server/processing/schemas'
import { getTopicLuaFillClass, getTopicSqlFillClass } from '@/server/processing/topicChartColors'

type TopicFilter = TopicId | 'all'

type Props = {
  runs: ProcessingRunRow[]
  topicFilter: TopicFilter
  phaseFilter: ChartPhaseFilter
}

type TooltipState = {
  column: ChartRunColumn
  columnIndex: number
  x: number
  y: number
}

const CHART_HEIGHT = 280
const CHART_WIDTH = 720

const layerFillClass = (topicId: TopicId, phase: 'lua' | 'sql') =>
  phase === 'lua' ? getTopicLuaFillClass(topicId) : getTopicSqlFillClass(topicId)

const xAtIndex = (index: number, columnCount: number) => {
  const pad = 20
  const inner = CHART_WIDTH - pad * 2
  if (columnCount <= 1) return CHART_WIDTH / 2
  return pad + (index / (columnCount - 1)) * inner
}

export const ProcessingRunStackChart = ({ runs, topicFilter, phaseFilter }: Props) => {
  const chartTitleId = useId()
  const { chartColumns: columns, skippedRunIds } = partitionChartColumnsByTiming(
    buildChartColumns(runs, topicFilter, phaseFilter),
  )
  const layers = buildAreaLayers(columns)
  const maxDurationMs = getMaxChartDurationMs(columns) || 1
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  if (columns.length === 0 || !chartHasTimingData(columns)) {
    return (
      <div>
        <p className="text-sm text-gray-600">
          Keine Läufe in den letzten 14 Tagen mit Topic-Timing-Daten.
        </p>
        {skippedRunIds.length > 0 ? (
          <p className="mt-2 text-sm text-gray-600">
            Im Diagramm ausgeblendet (keine messbaren Topic-Zeiten):{' '}
            <span className="font-mono text-gray-800">
              {skippedRunIds.map((runId) => `#${runId}`).join(', ')}
            </span>
          </p>
        ) : null}
      </div>
    )
  }

  const pathOptions = {
    columnCount: columns.length,
    chartWidth: CHART_WIDTH,
    chartHeight: CHART_HEIGHT,
    maxMs: maxDurationMs,
  }

  const hoverBandWidth =
    columns.length <= 1 ? 32 : Math.max(24, (CHART_WIDTH - 40) / Math.max(columns.length - 1, 1))

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full rounded-lg bg-gray-100/80 ring-1 ring-gray-900/5"
        style={{ height: CHART_HEIGHT }}
        role="img"
        aria-labelledby={chartTitleId}
      >
        <title id={chartTitleId}>Processing-Laufzeiten der letzten 14 Tage</title>

        <line
          x1={20}
          y1={CHART_HEIGHT}
          x2={CHART_WIDTH - 20}
          y2={CHART_HEIGHT}
          className="stroke-gray-300"
          strokeWidth={1}
        />

        {layers.map((layer, layerIndex) => (
          <motion.path
            key={layer.key}
            d={buildStackedAreaPath(layerIndex, layers, pathOptions)}
            className={twMerge(layerFillClass(layer.topicId, layer.phase), 'stroke-none')}
            fillOpacity={0.9}
            initial={false}
            animate={{ d: buildStackedAreaPath(layerIndex, layers, pathOptions) }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          />
        ))}

        {columns.map((column, columnIndex) => {
          const cx = xAtIndex(columnIndex, columns.length)
          return (
            <rect
              key={column.runId}
              x={cx - hoverBandWidth / 2}
              y={0}
              width={hoverBandWidth}
              height={CHART_HEIGHT}
              className="fill-transparent"
              onMouseEnter={(e) => {
                setTooltip({
                  column,
                  columnIndex,
                  x: e.clientX,
                  y: e.clientY,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}
      </svg>

      <div
        className="mt-2 grid text-[0.65rem] leading-tight text-gray-600 tabular-nums"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column.runId} className="truncate text-center">
            {format(column.startedAt, 'dd.MM.', { locale: de })}
          </span>
        ))}
      </div>

      {skippedRunIds.length > 0 ? (
        <p className="mt-2 text-sm text-gray-600">
          Im Diagramm ausgeblendet (keine messbaren Topic-Zeiten):{' '}
          <span className="font-mono text-gray-800">
            {skippedRunIds.map((runId) => `#${runId}`).join(', ')}
          </span>
        </p>
      ) : null}

      <AnimatePresence>
        {tooltip ? (
          <motion.div
            className="pointer-events-none fixed z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <p className="font-semibold">
              Run #{tooltip.column.runId} ·{' '}
              {format(tooltip.column.startedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
            </p>
            <p className="mt-1">
              Gesamt: {formatDurationMs(getChartColumnTotalMs(tooltip.column))}
            </p>
            {tooltip.column.segments.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-gray-300">
                {tooltip.column.segments.map((segment) => (
                  <li key={`${segment.topicId}-${segment.phase}`}>
                    {segment.topicId} · {segment.phase.toUpperCase()} ·{' '}
                    {formatDurationMs(segment.durationMs)}
                  </li>
                ))}
              </ul>
            ) : null}
            {tooltip.column.skippedTopics.length > 0 ? (
              <p className="mt-1 text-gray-300">
                Übersprungen:{' '}
                {tooltip.column.skippedTopics.map((s) => `${s.topicId} (${s.reason})`).join(', ')}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
