import { differenceInMilliseconds, subDays } from 'date-fns'
import { topicIds, type TopicId } from '@/data/processingTypes/topicId.generated.const'
import type {
  ProcessingRunRow,
  ProcessingTopicsMeta,
  TopicPhaseWindow,
  TopicSkippedEntry,
  TopicTimingEntry,
} from './schemas'

const knownTopicIdSet = new Set<string>(topicIds)

const isKnownTopicId = (id: string): id is TopicId => knownTopicIdSet.has(id)

const getOrphanedTopicIds = (topics: ProcessingTopicsMeta) =>
  Object.keys(topics)
    .filter((id) => !isKnownTopicId(id))
    .sort()

export const collectOrphanedTopicIdsFromRuns = (runs: ProcessingRunRow[]) => {
  const ids = new Set<string>()
  for (const run of runs) {
    for (const topicId of getOrphanedTopicIds(run.topics)) {
      ids.add(topicId)
    }
  }
  return [...ids].sort()
}

export type ParsedTopicTimingBase = {
  topicId: string
  status: 'completed' | 'skipped' | 'not_recorded'
  skipReason?: string
  luaMs?: number
  sqlMs?: number
  diffMs?: number
  totalMs?: number
}

export type ParsedOrphanedTopicTiming = ParsedTopicTimingBase & {
  topicId: string
}

export type ChartPhaseFilter = 'both' | 'lua' | 'sql'

type ChartSegment = {
  topicId: TopicId
  phase: 'lua' | 'sql'
  durationMs: number
}

export type ChartRunColumn = {
  runId: number
  startedAt: Date
  segments: ChartSegment[]
  skippedTopics: { topicId: TopicId; reason: string }[]
}

const phaseDurationMs = (window: TopicPhaseWindow | undefined) => {
  if (!window) return undefined
  const ms = differenceInMilliseconds(new Date(window.end), new Date(window.start))
  return ms > 0 ? ms : 0
}

const isSkippedTopicEntry = (entry: TopicTimingEntry | undefined): entry is TopicSkippedEntry => {
  return entry !== undefined && 'skipped' in entry
}

const parseTopicEntry = (topicId: string, entry: TopicTimingEntry | undefined) => {
  if (!entry) {
    return {
      topicId,
      status: 'not_recorded',
    } satisfies ParsedTopicTimingBase
  }

  if (isSkippedTopicEntry(entry)) {
    return {
      topicId,
      status: 'skipped',
      skipReason: entry.skipped,
    } satisfies ParsedTopicTimingBase
  }

  const luaMs = phaseDurationMs(entry.lua)
  const sqlMs = phaseDurationMs(entry.sql)
  const diffMs = phaseDurationMs(entry.diff)
  const parts = [luaMs, sqlMs, diffMs].filter((v): v is number => v !== undefined)
  const totalMs = parts.length > 0 ? parts.reduce((sum, v) => sum + v, 0) : undefined

  return {
    topicId,
    status: 'completed',
    luaMs,
    sqlMs,
    diffMs,
    totalMs,
  } satisfies ParsedTopicTimingBase
}

export const parseRunTopics = (topics: ProcessingTopicsMeta) => {
  return topicIds.map((topicId) => ({
    ...parseTopicEntry(topicId, topics[topicId]),
    topicId,
  }))
}

export const parseOrphanedRunTopics = (topics: ProcessingTopicsMeta) => {
  return getOrphanedTopicIds(topics).map((topicId) => ({
    ...parseTopicEntry(topicId, topics[topicId]),
    topicId,
  }))
}

export const countRunTopics = (topics: ProcessingTopicsMeta) => {
  let completed = 0
  let skipped = 0
  for (const topicId of topicIds) {
    const entry = topics[topicId]
    if (!entry) continue
    if (isSkippedTopicEntry(entry as TopicTimingEntry)) skipped += 1
    else completed += 1
  }
  return { completed, skipped }
}

export const formatDurationMs = (ms: number | undefined) => {
  if (ms === undefined) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':')
}

export const formatProcessingDuration = (duration: string | null) => {
  if (!duration) return '—'
  const [hours = '0', minutes = '0', seconds = '0'] = duration.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

export const getRunsForChart = (runs: ProcessingRunRow[], days = 14) => {
  const cutoff = subDays(new Date(), days)
  return runs
    .filter((run) => run.processing_started_at >= cutoff)
    .slice()
    .sort((a, b) => a.processing_started_at.getTime() - b.processing_started_at.getTime())
}

export const buildChartColumns = (
  runs: ProcessingRunRow[],
  topicFilter: TopicId | 'all',
  phaseFilter: ChartPhaseFilter,
) => {
  const chartRuns = getRunsForChart(runs)

  return chartRuns.map((run) => {
    const segments: ChartSegment[] = []
    const skippedTopics: ChartRunColumn['skippedTopics'] = []

    for (const topicId of topicIds) {
      if (topicFilter !== 'all' && topicId !== topicFilter) continue

      const entry = run.topics[topicId] as TopicTimingEntry | undefined
      if (!entry) continue

      if (isSkippedTopicEntry(entry)) {
        skippedTopics.push({ topicId, reason: entry.skipped })
        continue
      }

      if (phaseFilter !== 'sql' && entry.lua) {
        const durationMs = phaseDurationMs(entry.lua)
        if (durationMs !== undefined) {
          segments.push({ topicId, phase: 'lua', durationMs })
        }
      }

      if (phaseFilter !== 'lua' && entry.sql) {
        const durationMs = phaseDurationMs(entry.sql)
        if (durationMs !== undefined) {
          segments.push({ topicId, phase: 'sql', durationMs })
        }
      }
    }

    return {
      runId: run.id,
      startedAt: run.processing_started_at,
      segments,
      skippedTopics,
    }
  }) satisfies ChartRunColumn[]
}

export const getMaxChartDurationMs = (columns: ChartRunColumn[]) => {
  return columns.reduce((max, column) => {
    const total = getChartColumnTotalMs(column)
    return Math.max(max, total)
  }, 0)
}

export const getChartColumnTotalMs = (column: ChartRunColumn) =>
  column.segments.reduce((sum, segment) => sum + segment.durationMs, 0)

export const partitionChartColumnsByTiming = (columns: ChartRunColumn[]) => {
  const chartColumns: ChartRunColumn[] = []
  const skippedRunIds: number[] = []

  for (const column of columns) {
    if (getChartColumnTotalMs(column) > 0) {
      chartColumns.push(column)
    } else {
      skippedRunIds.push(column.runId)
    }
  }

  return { chartColumns, skippedRunIds }
}

export const chartHasTimingData = (columns: ChartRunColumn[]) =>
  columns.some((column) => getChartColumnTotalMs(column) > 0)

export type AreaLayer = {
  key: string
  topicId: TopicId
  phase: 'lua' | 'sql'
  valuesMs: number[]
}

export const buildAreaLayers = (columns: ChartRunColumn[]) => {
  if (columns.length === 0) return []

  const layerKeys = new Map<string, AreaLayer>()

  for (const column of columns) {
    for (const segment of column.segments) {
      const key = `${segment.topicId}-${segment.phase}`
      const existing = layerKeys.get(key)
      if (existing) continue
      layerKeys.set(key, {
        key,
        topicId: segment.topicId,
        phase: segment.phase,
        valuesMs: columns.map((col) => {
          const match = col.segments.find(
            (s) => s.topicId === segment.topicId && s.phase === segment.phase,
          )
          return match?.durationMs ?? 0
        }),
      })
    }
  }

  return [...layerKeys.values()].sort((a, b) => {
    const topicOrder = topicIds.indexOf(a.topicId) - topicIds.indexOf(b.topicId)
    if (topicOrder !== 0) return topicOrder
    return a.phase === 'lua' ? -1 : 1
  })
}

type AreaPathOptions = {
  columnCount: number
  chartWidth: number
  chartHeight: number
  maxMs: number
}

const yAtMs = (ms: number, chartHeight: number, maxMs: number) =>
  chartHeight - (ms / maxMs) * chartHeight

const xAtIndex = (index: number, columnCount: number, chartWidth: number) => {
  const pad = 20
  const inner = chartWidth - pad * 2
  if (columnCount <= 1) return chartWidth / 2
  return pad + (index / (columnCount - 1)) * inner
}

export const buildStackedAreaPath = (
  layerIndex: number,
  layers: AreaLayer[],
  options: AreaPathOptions,
) => {
  const { columnCount, chartWidth, chartHeight, maxMs } = options
  const layer = layers[layerIndex]
  if (!layer || columnCount === 0) return ''

  const stackBelowMs = (columnIndex: number) =>
    layers.slice(0, layerIndex).reduce((sum, entry) => sum + (entry.valuesMs[columnIndex] ?? 0), 0)

  if (columnCount === 1) {
    const cx = chartWidth / 2
    const halfWidth = 16
    const bottomMs = stackBelowMs(0)
    const topMs = bottomMs + (layer.valuesMs[0] ?? 0)
    const yTop = yAtMs(topMs, chartHeight, maxMs)
    const yBottom = yAtMs(bottomMs, chartHeight, maxMs)
    return `M ${cx - halfWidth},${yTop} L ${cx + halfWidth},${yTop} L ${cx + halfWidth},${yBottom} L ${cx - halfWidth},${yBottom} Z`
  }

  const topLine = Array.from({ length: columnCount }, (_, index) => {
    const x = xAtIndex(index, columnCount, chartWidth)
    const y = yAtMs(stackBelowMs(index) + (layer.valuesMs[index] ?? 0), chartHeight, maxMs)
    return `${x},${y}`
  }).join(' L ')

  const bottomLine = Array.from({ length: columnCount }, (_, index) => {
    const reverseIndex = columnCount - 1 - index
    const x = xAtIndex(reverseIndex, columnCount, chartWidth)
    const y = yAtMs(stackBelowMs(reverseIndex), chartHeight, maxMs)
    return `${x},${y}`
  }).join(' L ')

  return `M ${topLine} L ${bottomLine} Z`
}
