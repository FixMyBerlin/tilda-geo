import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import {
  AdminTableActions,
  AdminTableDeleteButton,
  AdminTableEditLink,
} from '@/components/admin/AdminTableActions'
import { Pill } from '@/components/shared/text/Pill'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { RegionContractStatus } from '@/prisma/generated/browser'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { deleteRegionContractFn } from '@/server/region-contracts/region-contracts.functions'
import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'

type Props = {
  contracts: TRegionContract[]
}

const header = [
  'Name',
  'Slug',
  'Status',
  'Regionen',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const RegionContractsTable = ({ contracts }: Props) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteContract = useMutation({
    mutationFn: (slug: string) => deleteRegionContractFn({ data: { slug } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      await router.invalidate()
      toastSuccess('Gelöscht.')
    },
  })

  return (
    <AdminTable header={header}>
      {contracts.map((contract) => (
        <tr key={contract.slug}>
          <th scope="row" className={adminTableClasses.thRow}>
            {contract.name}
          </th>
          <td className={adminTableClasses.td}>
            <code className="text-xs text-gray-700">{contract.slug}</code>
          </td>
          <td className={adminTableClasses.td}>
            <Pill color={contract.status === RegionContractStatus.ACTIVE ? 'green' : 'gray'}>
              {contract.status === RegionContractStatus.ACTIVE ? 'Aktiv' : 'Inaktiv'}
            </Pill>
          </td>
          <td className={adminTableClasses.td}>{contract.regionCount}</td>
          <td className={adminTableClasses.td}>
            <AdminTableActions>
              <AdminTableEditLink
                to="/admin/region-contracts/$slug/edit"
                params={{ slug: contract.slug }}
              />
              <AdminTableDeleteButton
                label={`Auftrag ${contract.slug} löschen`}
                title={`Auftrag „${contract.name}“ löschen?`}
                description={`Der Auftrag »${contract.slug}« wird unwiderruflich gelöscht.`}
                onDelete={async () => {
                  await deleteContract.mutateAsync(contract.slug)
                }}
              />
            </AdminTableActions>
          </td>
        </tr>
      ))}
    </AdminTable>
  )
}
