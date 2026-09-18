import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableViewLink } from '@/components/admin/AdminTableActions'
import { countRunTopics, formatProcessingDuration } from '@/server/processing/parseTopicTimings'
import type { ProcessingRunRow } from '@/server/processing/schemas'
import { ProcessingStatusPill } from './ProcessingStatusPill'

type Props = {
  runs: ProcessingRunRow[]
  /** Rendered inside the table card (pagination). */
  footer?: ReactNode
}

const header = [
  '#',
  'Gestartet',
  'Status',
  'Dauer',
  'OSM-Daten',
  'Topics',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const ProcessingRunsTable = ({ runs, footer }: Props) => (
  <AdminTable header={header} footer={footer}>
    {runs.map((run) => {
      const { completed, skipped } = countRunTopics(run.topics)
      const topicsSummary = [
        completed > 0 ? `${completed} abgeschlossen` : null,
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
            <AdminTableActions>
              <AdminTableViewLink
                to="/admin/processing/$metaId"
                params={{ metaId: String(run.id) }}
              >
                Anzeigen
              </AdminTableViewLink>
            </AdminTableActions>
          </td>
        </tr>
      )
    })}
  </AdminTable>
)
