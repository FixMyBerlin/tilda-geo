import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Link } from '@/components/shared/links/Link'
import { countRunTopics, formatProcessingDuration } from '@/server/processing/parseTopicTimings'
import type { ProcessingRunRow } from '@/server/processing/schemas'
import { ProcessingStatusPill } from './ProcessingStatusPill'

type Props = {
  runs: ProcessingRunRow[]
}

export const ProcessingRunsTable = ({ runs }: Props) => {
  if (runs.length === 0) {
    return <p className="text-sm text-gray-600">Noch keine Processing-Läufe vorhanden.</p>
  }

  return (
    <AdminTable header={['#', 'Gestartet', 'Status', 'Dauer', 'OSM-Daten', 'Topics', '']}>
      {runs.map((run) => {
        const { completed, skipped } = countRunTopics(run.topics)
        const topicsSummary = [
          completed > 0 ? `${completed} ✓` : null,
          skipped > 0 ? `${skipped} übersprungen` : null,
        ]
          .filter(Boolean)
          .join(' · ')

        return (
          <tr key={run.id}>
            <th scope="row" className={adminTableClasses.thRow}>
              {run.id}
            </th>
            <td className={adminTableClasses.td}>
              {format(run.processing_started_at, 'dd.MM.yyyy HH:mm', { locale: de })}
            </td>
            <td className={adminTableClasses.td}>
              <ProcessingStatusPill status={run.status} />
            </td>
            <td className={adminTableClasses.td}>
              {formatProcessingDuration(run.processing_duration)}
            </td>
            <td className={adminTableClasses.td}>
              {run.osm_data_from ? format(run.osm_data_from, 'dd.MM.yyyy', { locale: de }) : '—'}
            </td>
            <td className={adminTableClasses.td}>{topicsSummary || '—'}</td>
            <td className={adminTableClasses.td}>
              <Link
                to="/admin/processing/$metaId"
                params={{ metaId: String(run.id) }}
                className="inline-flex items-center gap-0.5"
              >
                Details
                <ChevronRightIcon aria-hidden className="size-4 shrink-0" />
              </Link>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
