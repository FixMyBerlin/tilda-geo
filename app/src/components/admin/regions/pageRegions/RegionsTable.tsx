import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AdminEditActionLink } from '@/components/admin/adminPageTitle'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { RegionPromotedPill } from '@/components/regionen/regionMeta/RegionPromotedPill'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { Link } from '@/components/shared/links/Link'
import { toastError } from '@/components/shared/toast/toastError'
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

export const RegionsTable = ({ regions, showContractGroups = false }: Props) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutate: deleteRegionMutation } = useMutation({
    mutationFn: (input: { slug: string }) => deleteRegionFn({ data: input }),
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message)
        return
      }
      await queryClient.invalidateQueries({ queryKey: regionenIndexQueryKey })
      await router.invalidate()
    },
    onError: (error) => {
      toastError(error, 'Fehler beim Löschen der Region')
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
    <AdminTable
      header={[
        'Name',
        'Status',
        'Gelistet',
        'Region',
        { id: 'regions-debug', label: '' },
        { id: 'regions-delete', label: '' },
        { id: 'regions-edit', label: '' },
      ]}
    >
      {sections.map((item) => {
        if (item.kind === 'group') {
          return (
            <tr key={`group:${item.key}`} className="bg-gray-100/90">
              <th
                colSpan={7}
                scope="colgroup"
                className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase"
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
              <RegionStatusPill status={region.status} />
            </td>
            <td className={adminTableClasses.td}>
              <RegionPromotedPill promoted={region.promoted} />
            </td>
            <td className={adminTableClasses.td}>
              <Link to="/regionen/$regionSlug" params={{ regionSlug: region.slug }}>
                Öffnen…
              </Link>
            </td>
            <td className={adminTableClasses.td}>
              <AdminConsoleDumpButton data={region} name={region.slug} />
            </td>
            <td className={adminTableClasses.td}>
              <AdminTrashIconButton
                ariaLabel={`Region ${region.slug} löschen`}
                onClick={() => {
                  if (window.confirm(`»${region.slug}« wirklich unwiderruflich löschen?`)) {
                    deleteRegionMutation({ slug: region.slug })
                  }
                }}
              />
            </td>
            <td className={adminTableClasses.td}>
              <AdminEditActionLink
                to="/admin/regions/$regionSlug/edit"
                params={{ regionSlug: region.slug }}
              />
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
