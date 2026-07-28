import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Pill } from '@/components/shared/text/Pill'
import type { ParsedOrphanedTopicTiming } from '@/server/processing/parseTopicTimings'
import { formatParsedTopicDurations } from './topicTimingDisplay'

const skipReasonLabels = {
  weekend: 'Wochenende',
  unchanged: 'Unverändert',
  process_only_topics: 'PROCESS_ONLY_TOPICS',
} as const

type Props = {
  topics: ParsedOrphanedTopicTiming[]
}

export const ProcessingOrphanedTopicsTable = ({ topics }: Props) => {
  if (topics.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900">Veraltete Topics</h2>
      <p className="mt-1 text-sm text-gray-600">
        In den Metadaten gespeichert, aber nicht mehr in der aktuellen Topic-Liste.
      </p>
      <div className="mt-4">
        <AdminTable header={['Topic', 'Status', 'Lua', 'SQL', 'Diff', 'Gesamt']}>
          {topics.map((parsed) => {
            const durations = formatParsedTopicDurations(parsed)

            return (
              <tr key={parsed.topicId}>
                <th scope="row" className={adminTableClasses.thRow}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{parsed.topicId}</span>
                    <Pill color="gray">veraltet</Pill>
                  </div>
                </th>
                <td className={adminTableClasses.td}>
                  {parsed.status === 'skipped' ? (
                    <span className="text-gray-600">
                      Übersprungen
                      {parsed.skipReason
                        ? ` (${skipReasonLabels[parsed.skipReason as keyof typeof skipReasonLabels] ?? parsed.skipReason})`
                        : ''}
                    </span>
                  ) : (
                    'Abgeschlossen'
                  )}
                </td>
                <td className={adminTableClasses.td}>{durations.lua}</td>
                <td className={adminTableClasses.td}>{durations.sql}</td>
                <td className={adminTableClasses.td}>{durations.diff}</td>
                <td className={adminTableClasses.td}>{durations.total}</td>
              </tr>
            )
          })}
        </AdminTable>
      </div>
    </section>
  )
}
