import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Pill } from '@/components/shared/text/Pill'
import type { ParsedOrphanedTopicTiming } from '@/server/processing/parseTopicTimings'
import { formatParsedTopicDurations, TopicTimingStatus } from './topicTimingDisplay'

type Props = {
  topics: ParsedOrphanedTopicTiming[]
}

/** Topics stored in the run metadata that are no longer in the current topic list. */
export const ProcessingOrphanedTopicsTable = ({ topics }: Props) => (
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
            <TopicTimingStatus parsed={parsed} />
          </td>
          <td className={adminTableClasses.td}>{durations.lua}</td>
          <td className={adminTableClasses.td}>{durations.sql}</td>
          <td className={adminTableClasses.td}>{durations.diff}</td>
          <td className={adminTableClasses.td}>{durations.total}</td>
        </tr>
      )
    })}
  </AdminTable>
)
