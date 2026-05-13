import { adminTableClasses } from '@/components/admin/AdminTable'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { Link } from '@/components/shared/links/Link'
import { staticRegion } from '@/data/regions.const'
import type { TRegion } from '@/server/regions/queries/getRegion.server'

export const MissingRegions = ({ regions }: { regions: TRegion[] }) => {
  const existingRegionSlugs = regions.map((region) => region.slug)
  const missingRegions = staticRegion.filter((region) => !existingRegionSlugs.includes(region.slug))

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-gray-900">Fehlende Regionen</h2>
      <p className="mt-2 max-w-prose text-base leading-7 text-gray-600">
        Regionen die in der DB fehlen aber in unserer statischen Datei vorliegen.
      </p>
      <table className={`mt-6 ${adminTableClasses.table}`}>
        <thead>
          <tr className={adminTableClasses.headRow}>
            <th scope="col" className={adminTableClasses.th}>
              Name
            </th>
            <th scope="col" className={adminTableClasses.th} />
            <th scope="col" className={adminTableClasses.th} />
          </tr>
        </thead>
        <tbody className={adminTableClasses.body}>
          {missingRegions.map((region) => (
            <tr key={region.slug}>
              <th scope="row" className={adminTableClasses.thRow}>
                <strong>{region.name}</strong>
              </th>
              <td className={adminTableClasses.td}>
                <ObjectDump data={region} />
              </td>
              <td className={adminTableClasses.td}>
                <Link to="/admin/regions/new" search={{ slug: region.slug }}>
                  Anlegen
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
