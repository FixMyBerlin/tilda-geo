import { getRouteApi } from '@tanstack/react-router'
import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { RegionStatusPill } from '@/components/admin/RegionStatusPill'
import { twMerge } from 'tailwind-merge'
import { RemoveMembershipButton } from './pageRegions/RemoveMembershipButton'
import { RegionFormEdit } from './pageRegions/RegionFormEdit'

const routeApi = getRouteApi('/admin/regions/$regionSlug/edit')

export function PageRegionEdit() {
  const { region, users } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            { href: `/admin/regions/${region.slug}/edit`, name: 'Bearbeiten' },
          ]}
        />
      </HeaderWrapper>

      <ObjectDump data={region} className="my-10" />

      <div className="my-10">
        <h2 className="mb-4 text-xl font-semibold">Benutzer dieser Region</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">Keine Benutzer gefunden</p>
        ) : (
          <table className={twMerge(adminTableClasses.table, 'w-full min-w-full')}>
            <thead>
              <tr className={adminTableClasses.headRow}>
                <th scope="col" className={adminTableClasses.thLeft}>
                  Benutzer
                </th>
                <th scope="col" className={adminTableClasses.thLeft}>
                  Regionen
                </th>
                <th scope="col" className={adminTableClasses.thLeft}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className={adminTableClasses.body}>
              {users.map((user) => {
                const membershipInRegion = user.Membership.find(
                  (m) => m.region.slug === region.slug,
                )

                return (
                  <tr key={user.id}>
                    <td className={twMerge(adminTableClasses.td, 'align-top py-3')}>
                      <strong>OSM: {user.osmName}</strong> ({user.osmId})
                      <br />
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '–'}
                      <br />
                      {user.email || '–'}
                    </td>
                    <td className={twMerge(adminTableClasses.td, 'align-top py-3')}>
                      <ul className={adminBulletedListClassName}>
                        {user.Membership.map((membership) => (
                          <li key={membership.id}>
                            <div className="flex items-center gap-2">
                              <span>{membership.region.slug}</span>
                              <RegionStatusPill
                                status={membership.region.status}
                                className="text-xs"
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={twMerge(adminTableClasses.td, 'align-top py-3')}>
                      {membershipInRegion ? (
                        <RemoveMembershipButton membershipId={membershipInRegion.id} />
                      ) : (
                        '–'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <RegionFormEdit
        initialSlug={region.slug}
        initialPromoted={region.promoted ? 'true' : 'false'}
        initialStatus={region.status}
      />
    </>
  )
}
