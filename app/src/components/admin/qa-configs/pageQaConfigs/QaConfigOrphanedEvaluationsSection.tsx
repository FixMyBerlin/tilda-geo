import { getRouteApi } from '@tanstack/react-router'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { formatUserNameWithOsmHandle } from '@/components/admin/memberships/pageMemberships/utils/formatUserName'
import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { Callout } from '@/components/shared/Callout/Callout'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
import type {
  QaOrphanedEvaluation,
  QaOrphanedEvaluationsResult,
} from '@/server/qa-configs/queries/getQaOrphanedEvaluationsForAdmin.server'

const routeApi = getRouteApi('/admin/qa-configs/$id/edit')

type Props = {
  orphanedEvaluations: QaOrphanedEvaluationsResult
}

const latestStatusLabel = (item: QaOrphanedEvaluation) => {
  if (item.evaluatorType === 'USER' && item.userStatus) {
    return userStatusConfig[item.userStatus].label
  }
  return systemStatusConfig[item.systemStatus].label
}

export function QaConfigOrphanedEvaluationsSection({ orphanedEvaluations }: Props) {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { page, goToPage, result } = useAdminTablePagination(search, navigate, orphanedEvaluations)

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
      <Callout tone="warning" className="mb-3">
        <p>
          Verwaiste Bewertungen verweisen auf Bereiche, die in der Kartentabelle dieser
          Konfiguration nicht mehr vorkommen — typischerweise nach dem Import einer neuen
          Voronoi-Grundlage. Sie haben keine Geometrie und erscheinen daher nicht in der Region
          (Karte/Liste).
        </p>
      </Callout>

      {orphanedEvaluations.total === 0 ? (
        <p className="text-sm text-gray-600">Keine verwaisten Bewertungen.</p>
      ) : (
        <div className={adminTableClasses.paginatedShell}>
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
            {orphanedEvaluations.rows.map((item) => (
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
                <td className={adminTableClasses.td}>
                  {formatUserNameWithOsmHandle({
                    firstName: item.authorFirstName,
                    lastName: item.authorLastName,
                    osmName: item.authorOsmName,
                  }) || '—'}
                </td>
                <td className={adminTableClasses.td}>{formatDateTimeBerlin(item.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
          <PaginationControls page={page} result={result} onPageChange={goToPage} />
        </div>
      )}
    </section>
  )
}
