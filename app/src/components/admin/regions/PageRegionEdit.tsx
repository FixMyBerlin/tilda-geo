import { getRouteApi } from '@tanstack/react-router'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { AdminPageTitleEdit, AdminPageTitleEditLabel } from '@/components/admin/adminPageTitle'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { buildUploadsListSearch } from '@/components/admin/map-dataset-uploads/pageMapDatasetUploads/mapDatasetUploadsListSearch'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { Quote } from '@/components/shared/text/Quotes'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { RegionFormEdit } from './pageRegions/RegionFormEdit'
import { RemoveMembershipButton } from './pageRegions/RemoveMembershipButton'

const routeApi = getRouteApi('/admin/regions/$regionSlug/edit')

export function PageRegionEdit() {
  const { region, users, formConfig, maskConfig, contracts, auditHistory } =
    routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            {
              href: `/admin/regions/${region.slug}/edit`,
              name: <AdminPageTitleEditLabel name={region.name} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleEdit name={region.name} />

      <p className="mt-4 text-sm text-gray-700">
        <Link
          to="/admin/map-dataset-uploads"
          search={buildUploadsListSearch({ regionSlug: region.slug })}
        >
          Uploads dieser Region
        </Link>
      </p>

      <div className="my-10">
        <h2 className="mb-4 text-xl font-semibold">
          Benutzer von <Quote>{region.name}</Quote>
        </h2>
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
                  Aktionen
                </th>
                <th scope="col" className={adminTableClasses.thLeft}>
                  Alle Regionen
                </th>
              </tr>
            </thead>
            <tbody className={adminTableClasses.body}>
              {users.map((user) => {
                const membershipInRegion = user.memberships.find(
                  (m) => m.region.slug === region.slug,
                )

                return (
                  <tr key={user.id}>
                    <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
                      <strong>OSM: {user.osmName}</strong> ({user.osmId})
                      <br />
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '–'}
                      <br />
                      {hasContactEmail(user.email) ? user.email : '–'}
                    </td>
                    <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
                      {membershipInRegion ? (
                        <RemoveMembershipButton membershipId={membershipInRegion.id} />
                      ) : (
                        '–'
                      )}
                    </td>
                    <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
                      <details>
                        <summary className={twJoin(linkStyles, 'cursor-pointer whitespace-nowrap')}>
                          Alle Regionen ({user.memberships.length})
                        </summary>
                        <ul className={twMerge(adminBulletedListClassName, 'mt-2')}>
                          {user.memberships.map((membership) => (
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
                      </details>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <RegionFormEdit
        formConfig={formConfig}
        maskConfig={maskConfig}
        contracts={contracts}
        regionId={region.id}
      />

      <AuditHistoryPanel rows={auditHistory} model="Region" recordId={String(region.id)} />
    </>
  )
}
