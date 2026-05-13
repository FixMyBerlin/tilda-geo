import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { RegionStatusPill } from '@/components/admin/RegionStatusPill'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { TRegion } from '@/server/regions/queries/getRegion.server'
import { deleteRegionFn } from '@/server/regions/regions.functions'

type Props = {
  regions: TRegion[]
}

export const RegionsTable = ({ regions }: Props) => {
  const router = useRouter()
  const { mutate: deleteRegionMutation } = useMutation({
    mutationFn: (input: { slug: string }) => deleteRegionFn({ data: input }),
    onSuccess: async () => {
      await router.invalidate()
    },
  })

  return (
    <AdminTable
      header={[
        'Name',
        'Status',
        'Gelistet',
        'Region',
        'Rohdaten',
        { id: 'regions-delete', label: '' },
        { id: 'regions-edit', label: '' },
      ]}
    >
      {regions.map((region) => {
        return (
          <tr key={region.slug}>
            <th scope="row" className={adminTableClasses.thRow}>
              {region.name}
            </th>
            <td className={adminTableClasses.td}>
              <RegionStatusPill status={region.status} />
            </td>
            <td className={adminTableClasses.td}>
              {region.promoted ? (
                <Pill color="green">Gelistet</Pill>
              ) : (
                <Pill color="red">Nicht gelistet</Pill>
              )}
            </td>
            <td className={adminTableClasses.td}>
              <Link to="/regionen/$regionSlug" params={{ regionSlug: region.slug }}>
                Öffnen…
              </Link>
            </td>
            <td className={adminTableClasses.td}>
              <ObjectDump data={region} />
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
              <Link to="/admin/regions/$regionSlug/edit" params={{ regionSlug: region.slug }}>
                Bearbeiten
              </Link>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
