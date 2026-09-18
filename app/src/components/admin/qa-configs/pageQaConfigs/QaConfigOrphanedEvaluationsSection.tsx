import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { formatUserNameWithOsmHandle } from '@/components/admin/memberships/pageMemberships/utils/formatUserName'
import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { Callout } from '@/components/shared/Callout/Callout'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import type {
  QaOrphanedEvaluation,
  QaOrphanedEvaluationsResult,
} from '@/server/qa-configs/queries/getQaOrphanedEvaluationsForAdmin.server'

type Props = {
  /** Section id for the jump list — usually `orphaned`. */
  id: string
  title: string
  orphanedEvaluations: QaOrphanedEvaluationsResult
}

const latestStatusLabel = (item: QaOrphanedEvaluation) => {
  if (item.evaluatorType === 'USER' && item.userStatus) {
    return userStatusConfig[item.userStatus].label
  }
  return systemStatusConfig[item.systemStatus].label
}

/** Render only when there are orphaned evaluations (`orphanedEvaluations.total > 0`). */
export function QaConfigOrphanedEvaluationsSection({ id, title, orphanedEvaluations }: Props) {
  return (
    <AdminFormSection id={id} title={title}>
      <Callout tone="warning">
        <p>
          Verwaiste Bewertungen verweisen auf Bereiche, die in der Kartentabelle dieser
          Konfiguration nicht mehr vorkommen — typischerweise nach dem Import einer neuen
          Voronoi-Grundlage. Sie haben keine Geometrie und erscheinen daher nicht in der Region
          (Karte/Liste).
        </p>
      </Callout>

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
        footer={<AdminPagination pagination={orphanedEvaluations} hash={id} />}
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
            <td className={adminTableClasses.td}>{item.evaluationCount.toLocaleString('de-DE')}</td>
            <td className={adminTableClasses.td}>{item.commentCount.toLocaleString('de-DE')}</td>
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
    </AdminFormSection>
  )
}
