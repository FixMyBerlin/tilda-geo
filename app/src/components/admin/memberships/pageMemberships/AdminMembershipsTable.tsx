import { useRouter } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'
import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { RegionStatusPill } from '@/components/admin/RegionStatusPill'
import { formatDate } from '@/components/shared/date/formatDate'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { formatRelativeTime } from '@/components/shared/date/relativeTime'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { deleteMembershipFn } from '@/server/memberships/memberships.functions'
import type { UserWithMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { getFullname } from './utils/getFullname'

type Props = {
  users: UserWithMemberships[]
}

export const AdminMembershipsTable = ({ users }: Props) => {
  const router = useRouter()

  const handleDelete = async (membership: UserWithMemberships['Membership'][number]) => {
    if (
      window.confirm(
        `Den Eintrag mit ID ${membership.id} auf Projekt ${membership.region.slug} unwiderruflich löschen?`,
      )
    ) {
      await deleteMembershipFn({ data: { id: membership.id } })
      router.invalidate()
    }
  }

  return (
    <table className={twMerge(adminTableClasses.table, 'w-full min-w-full')}>
      <thead>
        <tr className={adminTableClasses.headRow}>
          <th scope="col" className={adminTableClasses.thLeft}>
            User ({users.length})
          </th>
          <th scope="col" className={adminTableClasses.thLeft}>
            Projekt
          </th>
        </tr>
      </thead>

      <tbody className={adminTableClasses.body}>
        {users.map((user) => {
          return (
            <tr key={user.id}>
              <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
                <strong>OSM: {user.osmName}</strong>{' '}
                <span className="text-gray-400">({user.osmId})</span>
                {user.role === 'ADMIN' && (
                  <Pill color="yellow" className="ml-1">
                    Admin
                  </Pill>
                )}
                <br />
                {getFullname(user) || '–'}
                <br />
                {hasContactEmail(user.email) ? user.email : '–'}
                <br />
                {formatDate(user.createdAt)}{' '}
                <span className="text-gray-400">({formatRelativeTime(user.createdAt)})</span>
              </td>
              <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
                {user?.Membership?.length === 0 ? (
                  <>Bisher keine Rechte</>
                ) : (
                  <ul className={twMerge(adminBulletedListClassName, 'mt-0')}>
                    {user?.Membership?.map((membership) => {
                      return (
                        <li key={membership.id}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Link
                                blank
                                to="/regionen/$regionSlug"
                                params={{ regionSlug: membership.region.slug }}
                              >
                                {membership.region.slug}
                              </Link>
                              <RegionStatusPill
                                status={membership.region.status}
                                className="text-xs"
                              />
                            </div>
                            <AdminTrashIconButton
                              ariaLabel={`Mitgliedschaft ${membership.region.slug} löschen`}
                              onClick={() => void handleDelete(membership)}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="mt-2 border-t pt-2">
                  <Link
                    href={`/admin/memberships/new?${new URLSearchParams({
                      userId: String(user.id),
                    })}`}
                  >
                    Rechte vergeben
                  </Link>
                </div>
                {/* Accessed Regions */}
                {user.accessedRegions && user.accessedRegions.length > 0 && (
                  <div className="mt-4 border-t pt-2">
                    <div className="mb-1 font-semibold text-gray-600">Zugriffene Regionen:</div>
                    <ul className={twMerge(adminBulletedListClassName, 'text-xs')}>
                      {user.accessedRegions.map((accessedRegion) => {
                        const hasAccess = user.Membership?.some(
                          (m) => m.region.slug === accessedRegion.slug,
                        )
                        const relativeTime = formatRelativeTime(accessedRegion.lastAccessedDay)

                        return (
                          <li key={accessedRegion.slug}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Link
                                  blank
                                  href={`/regionen/${accessedRegion.slug}`}
                                  className="font-medium"
                                >
                                  {accessedRegion.slug}
                                </Link>
                                <span
                                  className="text-gray-400"
                                  title={formatDateTimeBerlin(accessedRegion.lastAccessedDay)}
                                >
                                  zuletzt {relativeTime}
                                </span>
                              </div>
                              {hasAccess ? (
                                <span className="text-xs text-green-600">Has access</span>
                              ) : (
                                <Link
                                  href={`/admin/memberships/new?${new URLSearchParams({
                                    userId: String(user.id),
                                    regionSlug: accessedRegion.slug,
                                  })}`}
                                  className={'text-xs'}
                                >
                                  Give access
                                </Link>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
