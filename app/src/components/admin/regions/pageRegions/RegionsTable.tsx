import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import {
  AdminTableActions,
  AdminTableDeleteButton,
  AdminTableEditLink,
  AdminTableExternalLink,
} from '@/components/admin/AdminTableActions'
import { RegionPromotedPill } from '@/components/regionen/regionMeta/RegionPromotedPill'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import {
  groupRegionsByContract,
  SINGLETON_CONTRACT_PARAM,
  UNASSIGNED_CONTRACT_GROUP_LABEL,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { regionenIndexQueryKey } from '@/server/regions/regionenIndexQueryOptions'
import { deleteRegionFn } from '@/server/regions/regions.functions'

type Props = {
  regions: TRegion[]
  showContractGroups?: boolean
}

const header = [
  'Region',
  'Auftrag',
  'Status',
  'Gelistet',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const RegionsTable = ({ regions, showContractGroups = false }: Props) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteRegion = useMutation({
    mutationFn: async (slug: string) => {
      const result = await deleteRegionFn({ data: { slug } })
      if (!result.success) throw new Error(result.message)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: regionenIndexQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey }),
      ])
      await router.invalidate()
      toastSuccess('Gelöscht.')
    },
  })

  let sections: Array<
    { kind: 'group'; name: string; key: string } | { kind: 'row'; region: TRegion }
  >
  if (!showContractGroups) {
    sections = regions.map((region) => ({ kind: 'row' as const, region }))
  } else {
    const grouped = groupRegionsByContract(regions)
    sections = []
    for (const { contract, regions: contractRegions } of grouped) {
      sections.push({
        kind: 'group',
        name: contract?.name ?? UNASSIGNED_CONTRACT_GROUP_LABEL,
        key: contract?.slug ?? SINGLETON_CONTRACT_PARAM,
      })
      for (const region of contractRegions) {
        sections.push({ kind: 'row', region })
      }
    }
  }

  return (
    <AdminTable header={header}>
      {sections.map((item) => {
        if (item.kind === 'group') {
          return (
            <tr key={`group:${item.key}`} className={adminTableClasses.groupRow}>
              <th
                colSpan={header.length}
                scope="colgroup"
                className={adminTableClasses.groupHeader}
              >
                {item.name}
              </th>
            </tr>
          )
        }

        const region = item.region
        return (
          <tr key={region.slug}>
            <th scope="row" className={adminTableClasses.thRow}>
              {region.name}
            </th>
            <td className={adminTableClasses.td}>
              {region.contract ? region.contract.name : <span className="text-gray-400">—</span>}
            </td>
            <td className={adminTableClasses.td}>
              <RegionStatusPill status={region.status} />
            </td>
            <td className={adminTableClasses.td}>
              <RegionPromotedPill promoted={region.promoted} />
            </td>
            <td className={adminTableClasses.td}>
              <AdminTableActions>
                <AdminTableEditLink
                  to="/admin/regions/$regionSlug/edit"
                  params={{ regionSlug: region.slug }}
                />
                <AdminTableExternalLink
                  to="/regionen/$regionSlug"
                  params={{ regionSlug: region.slug }}
                />
                <AdminTableDeleteButton
                  label={`Region ${region.slug} löschen`}
                  title={`Region „${region.name}“ löschen?`}
                  description={`Die Region »${region.slug}« wird unwiderruflich gelöscht.`}
                  onDelete={() => deleteRegion.mutateAsync(region.slug)}
                />
              </AdminTableActions>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
