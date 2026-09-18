import { twMerge } from 'tailwind-merge'
import type { TopicId } from '@/data/processingTypes/topicId.generated.const'
import { formatDurationMs, type ParsedTopicTimingBase } from '@/server/processing/parseTopicTimings'
import { getTopicLuaBgClass, getTopicSqlBgClass } from '@/server/processing/topicChartColors'

const topicSkipReasonLabels = {
  weekend: 'Wochenende',
  unchanged: 'Unverändert',
  process_only_topics: 'PROCESS_ONLY_TOPICS',
} as const

/** Status cell of a topic row (run detail topics + orphaned topics). */
export const TopicTimingStatus = ({ parsed }: { parsed: ParsedTopicTimingBase }) => {
  if (parsed.status === 'not_recorded') {
    return <span className="text-gray-500">Nicht erfasst</span>
  }
  if (parsed.status === 'skipped') {
    const reason = parsed.skipReason
      ? (topicSkipReasonLabels[parsed.skipReason as keyof typeof topicSkipReasonLabels] ??
        parsed.skipReason)
      : null
    return <span className="text-gray-600">Übersprungen{reason ? ` (${reason})` : ''}</span>
  }
  return <>Abgeschlossen</>
}

export const TopicTimingMicroBar = ({
  topicId,
  luaMs,
  sqlMs,
}: {
  topicId: TopicId
  luaMs?: number
  sqlMs?: number
}) => {
  const total = (luaMs ?? 0) + (sqlMs ?? 0)
  if (total <= 0) return <span className="text-gray-400">—</span>

  const luaPct = luaMs ? (luaMs / total) * 100 : 0
  const sqlPct = sqlMs ? (sqlMs / total) * 100 : 0

  return (
    <div className="flex h-2 w-16 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-900/5">
      {luaMs ? (
        <div
          className={twMerge('h-full', getTopicLuaBgClass(topicId))}
          style={{ width: `${luaPct}%` }}
        />
      ) : null}
      {sqlMs ? (
        <div
          className={twMerge('h-full', getTopicSqlBgClass(topicId))}
          style={{ width: `${sqlPct}%` }}
        />
      ) : null}
    </div>
  )
}

export const formatParsedTopicDurations = (parsed: ParsedTopicTimingBase) => ({
  lua: formatDurationMs(parsed.luaMs),
  sql: formatDurationMs(parsed.sqlMs),
  diff: formatDurationMs(parsed.diffMs),
  total: formatDurationMs(parsed.totalMs),
})
