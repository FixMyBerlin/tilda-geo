import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import type { QaOrphanedEvaluation } from '@/server/qa-configs/queries/getQaOrphanedEvaluationsForAdmin.server'

type Props = {
  items: QaOrphanedEvaluation[]
  totalCount: number
}

const formatAuthor = (item: QaOrphanedEvaluation) => {
  const name = [item.authorFirstName, item.authorLastName].filter(Boolean).join(' ')
  if (name && item.authorOsmName) return `${name} (${item.authorOsmName})`
  return name || item.authorOsmName || '—'
}

const latestStatusLabel = (item: QaOrphanedEvaluation) => {
  if (item.evaluatorType === 'USER' && item.userStatus) {
    return userStatusConfig[item.userStatus].label
  }
  return systemStatusConfig[item.systemStatus].label
}

export function QaConfigOrphanedEvaluationsSection({ items, totalCount }: Props) {
  const shown = items.length.toLocaleString('de-DE')
  const total = totalCount.toLocaleString('de-DE')

  return (
    <section
      className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="qa-orphaned-evaluations-heading"
    >
      <h2
        id="qa-orphaned-evaluations-heading"
        className="m-0 mb-3 text-lg font-semibold text-gray-900"
      >
        Verwaiste Bewertungen
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        Verwaiste Bewertungen verweisen auf Bereiche, die in der Kartentabelle dieser Konfiguration
        nicht mehr vorkommen — typischerweise nach dem Import einer neuen Voronoi-Grundlage. Sie
        haben keine Geometrie und erscheinen daher nicht in der Mitglieder-Kartenliste.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-600">Keine verwaisten Bewertungen.</p>
      ) : (
        <>
          {totalCount > items.length ? (
            <p className="mb-3 text-sm text-gray-600">
              Es werden {shown} von {total} verwaisten Bewertungen angezeigt.
            </p>
          ) : null}
          <AdminTable
            header={[
              'Bereich',
              'Status',
              'Bewertungen',
              'Kommentare',
              'Nutzerbewertungen',
              'Autor',
              'Letzte Bewertung',
            ]}
          >
            {items.map((item) => (
              <tr key={item.areaId}>
                <th scope="row" className={adminTableClasses.thRow}>
                  <span className="font-mono text-sm">{item.areaId}</span>
                </th>
                <td className={adminTableClasses.td}>
                  {latestStatusLabel(item)}
                  <span className="text-gray-500">
                    {' '}
                    ({evaluatorTypeConfig[item.evaluatorType].label})
                  </span>
                </td>
                <td className={adminTableClasses.td}>
                  {item.evaluationCount.toLocaleString('de-DE')}
                </td>
                <td className={adminTableClasses.td}>
                  {item.commentCount.toLocaleString('de-DE')}
                </td>
                <td className={adminTableClasses.td}>
                  {item.userEvaluationCount.toLocaleString('de-DE')}
                </td>
                <td className={adminTableClasses.td}>{formatAuthor(item)}</td>
                <td className={adminTableClasses.td}>{formatDateTimeBerlin(item.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </>
      )}
    </section>
  )
}
