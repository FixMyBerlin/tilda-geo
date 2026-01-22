'use client'
import { Link } from '@/src/app/_components/links/Link'
import { linkStyles } from '@/src/app/_components/links/styles'
import { Pill } from '@/src/app/_components/text/Pill'
import { RegionStatusPill } from '@/src/app/admin/_components/RegionStatusPill'
import deleteRegion from '@/src/server/regions/mutations/deleteRegion'
import { TRegion } from '@/src/server/regions/queries/getRegion'
import { useMutation } from '@blitzjs/rpc'
import { useRouter } from 'next/navigation'
import { AdminTable } from '../../_components/AdminTable'
import { ObjectDump } from '../../_components/ObjectDump'

export const RegionsTable = ({ regions }: { regions: TRegion[] }) => {
  const router = useRouter()
  const [deleteRegionMutation] = useMutation(deleteRegion)

  return (
    <AdminTable header={['Name', 'Status', 'Gelistet', 'Atlas', 'Rohdaten', '', '']}>
      {regions.map((region) => {
        return (
          <tr key={region.slug}>
            <th>{region.name}</th>
            <td>
              <RegionStatusPill status={region.status} />
            </td>
            <td>
              {region.promoted ? (
                <Pill color="green">Gelistet</Pill>
              ) : (
                <Pill color="red" inverted>Nicht gelistet</Pill>
              )}
            </td>
            <td>
              <Link href={`/regionen/${region.slug}`}>Öffnen…</Link>
            </td>
            <td>
              <ObjectDump data={region} />
            </td>
            <td>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`»${region.slug}« wirklich unwiderruflich löschen?`)) {
                    try {
                      await deleteRegionMutation({ slug: region.slug })
                      router.push('/admin/regions')
                    } catch (error: any) {
                      window.alert(error.toString())
                      console.error(error)
                    }
                  }
                }}
                className={linkStyles}
              >
                Löschen
              </button>
            </td>
            <td>
              <Link href={`/admin/regions/${region.slug}/edit`}>Bearbeiten</Link>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
