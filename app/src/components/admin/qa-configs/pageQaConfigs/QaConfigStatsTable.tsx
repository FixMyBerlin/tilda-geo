import { twJoin } from 'tailwind-merge'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import {
  evaluatorTypeConfig,
  systemStatusConfig,
  userStatusConfig,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import type { QaConfigStats } from '@/server/qa-configs/queries/getQaConfigStatsForAdmin.server'

const header = ['Bewertet von', 'Status', { id: 'count', label: 'Anzahl', align: 'right' as const }]

const countClassName = twJoin(adminTableClasses.td, 'text-right tabular-nums')

export function QaConfigStatsTable({ stats }: { stats: QaConfigStats }) {
  const rows = [
    ...(['GOOD', 'NEEDS_REVIEW', 'PROBLEMATIC', 'TRUSTED_EDITOR_CHANGE'] as const).map(
      (status) => ({
        evaluator: evaluatorTypeConfig.SYSTEM.label,
        status,
        label: systemStatusConfig[status].label,
        hexColor: systemStatusConfig[status].hexColor,
        count: stats.evaluationStats.SYSTEM[status],
      }),
    ),
    ...(
      [
        'OK_STRUCTURAL_CHANGE',
        'OK_REFERENCE_ERROR',
        'NOT_OK_DATA_ERROR',
        'NOT_OK_PROCESSING_ERROR',
        'OK_QA_TOOLING_ERROR',
      ] as const
    ).map((status) => ({
      evaluator: evaluatorTypeConfig.USER.label,
      status,
      label: userStatusConfig[status].label,
      hexColor: userStatusConfig[status].hexColor,
      count: stats.evaluationStats.USER[status],
    })),
  ]

  return (
    <AdminTable header={header}>
      {rows.map((row) => (
        <tr key={`${row.evaluator}:${row.status}`}>
          <td className={twJoin(adminTableClasses.td, 'whitespace-nowrap')}>{row.evaluator}</td>
          <td className={adminTableClasses.td}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: row.hexColor }}
              />
              <span>
                {row.label} <code className="text-xs text-gray-500">{row.status}</code>
              </span>
            </div>
          </td>
          <td className={countClassName}>{row.count.toLocaleString('de-DE')}</td>
        </tr>
      ))}
      <tr className="bg-gray-50">
        <th scope="row" colSpan={2} className={adminTableClasses.thRow}>
          Bereiche gesamt
        </th>
        <td className={twJoin(countClassName, 'font-semibold text-gray-900')}>
          {stats.totalAreas.toLocaleString('de-DE')}
        </td>
      </tr>
    </AdminTable>
  )
}
