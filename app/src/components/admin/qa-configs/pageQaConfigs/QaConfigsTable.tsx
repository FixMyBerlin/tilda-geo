import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import {
  AdminTableActions,
  AdminTableDeleteButton,
  AdminTableEditLink,
} from '@/components/admin/AdminTableActions'
import { Link } from '@/components/shared/links/Link'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { deleteQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import type { getQaConfigsForAdmin } from '@/server/qa-configs/queries/getQaConfigsForAdmin.server'
import { fractionToPercent } from '@/shared/qaThresholdPercent'
import { QaConfigStatusPill } from './QaConfigStatusPill'

type QaConfigRow = Awaited<ReturnType<typeof getQaConfigsForAdmin>>[number]

const header = [
  'Name',
  'Region',
  'Status',
  'Kartentabelle',
  'Schwellen',
  { id: 'evaluations', label: 'Bewertungen', align: 'right' as const },
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export function QaConfigsTable({ qaConfigs }: { qaConfigs: QaConfigRow[] }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteQaConfig = useMutation({
    mutationFn: async (id: number) => {
      await deleteQaConfigFn({ data: { id } })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      await router.invalidate()
      toastSuccess('Gelöscht.')
    },
  })

  return (
    <AdminTable header={header}>
      {qaConfigs.map((config) => (
        <tr key={config.id}>
          <th scope="row" className={twJoin(adminTableClasses.thRow, 'min-w-48')}>
            <span className="block">{config.label}</span>
            <code className="block text-xs font-normal whitespace-nowrap text-gray-500">
              {config.slug}
            </code>
          </th>
          <td className={twJoin(adminTableClasses.td, 'whitespace-nowrap')}>
            <Link to="/admin/regions/$regionSlug/edit" params={{ regionSlug: config.region.slug }}>
              {config.region.slug}
            </Link>
          </td>
          <td className={adminTableClasses.td}>
            <QaConfigStatusPill isActive={config.isActive} />
          </td>
          <td className={adminTableClasses.td}>
            <code className="text-xs break-all">{config.mapTable}</code>
          </td>
          <td className={twJoin(adminTableClasses.td, 'whitespace-nowrap tabular-nums')}>
            {fractionToPercent(config.goodThreshold)} % /{' '}
            {fractionToPercent(config.needsReviewThreshold)} % · ±
            {config.absoluteDifferenceThreshold}
          </td>
          <td className={twJoin(adminTableClasses.td, 'text-right tabular-nums')}>
            {config._count.qaEvaluations.toLocaleString('de-DE')}
          </td>
          <td className={adminTableClasses.td}>
            <AdminTableActions>
              <AdminTableEditLink
                to="/admin/qa-configs/$id/edit"
                params={{ id: String(config.id) }}
              />
              <AdminTableDeleteButton
                label={`QA-Konfiguration ${config.slug} löschen`}
                title={`QA-Konfiguration „${config.label}“ löschen?`}
                description={`Die QA-Konfiguration »${config.slug}« wird unwiderruflich gelöscht. Solange Bewertungen existieren, schlägt das Löschen fehl.`}
                onDelete={() => deleteQaConfig.mutateAsync(config.id)}
              />
            </AdminTableActions>
          </td>
        </tr>
      ))}
    </AdminTable>
  )
}
