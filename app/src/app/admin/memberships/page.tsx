'use client'
import { formatDate } from '@/src/app/_components/date/formatDate'
import { formatDateTimeBerlin } from '@/src/app/_components/date/formatDateBerlin'
import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { Link } from '@/src/app/_components/links/Link'
import { linkStyles } from '@/src/app/_components/links/styles'
import { Pill } from '@/src/app/_components/text/Pill'
import deleteMembership from '@/src/server/memberships/mutations/deleteMembership'
import getUsersAndMemberships from '@/src/server/users/queries/getUsersAndMemberships'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { useRouter } from 'next/navigation'
import { Breadcrumb } from '../_components/Breadcrumb'
import { HeaderWrapper } from '../_components/HeaderWrapper'
import { getFullname } from './_components/utils/getFullname'

const MAX_TAKE = 1000

export default function AdminMembershipsPage() {
  const [{ users: userAndMemberships }] = useQuery(getUsersAndMemberships, { take: MAX_TAKE })

  const router = useRouter()
  const [deleteMembershipMutation] = useMutation(deleteMembership)
  const handleDelete = async (
    membership: (typeof userAndMemberships)[number]['Membership'][number],
  ) => {
    if (
      window.confirm(
        `Den Eintrag mit ID ${membership.id} auf Projekt ${membership.region.slug} unwiderruflich löschen?`,
      )
    ) {
      await deleteMembershipMutation({ id: membership.id })
      router.push('/admin/memberships')
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[{ href: '/admin/memberships', name: 'Nutzer:innen & Mitgliedschaften' }]}
        />
      </HeaderWrapper>

      {userAndMemberships.length >= MAX_TAKE && (
        <p className="my-12 text-red-500">
          Achtung, die Liste zeigt maximal {MAX_TAKE} Einträge. Wir müssen eine Paginierung bauen
          oder `maxTake` erhöhen.
        </p>
      )}

      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">
              User ({userAndMemberships.length})
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold sm:pr-6">
              Projekt
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {userAndMemberships.map((user) => {
            return (
              <tr key={user.id}>
                <td className="h-20 py-4 pl-4 pr-3 text-sm sm:pl-6">
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
                  {user.email || '–'}
                  <br />
                  {formatDate(user.createdAt)}{' '}
                  <span className="text-gray-400">({formatRelativeTime(user.createdAt)})</span>
                </td>
                <td className="h-20 py-4 pl-4 pr-3 text-sm sm:pr-6">
                  {user?.Membership?.length === 0 ? (
                    <>Bisher keine Rechte</>
                  ) : (
                    <ul>
                      {user?.Membership?.map((membership) => {
                        return (
                          <li key={membership.id} className="list-item list-disc">
                            <div className="flex justify-between">
                              <Link blank href={`/regionen/${membership.region.slug}`}>
                                {membership.region.slug}
                              </Link>
                              <button
                                onClick={() => handleDelete(membership)}
                                className={linkStyles}
                              >
                                Delete
                              </button>
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
                      <ul className="space-y-1">
                        {user.accessedRegions.map((accessedRegion) => {
                          const hasAccess = user.Membership?.some(
                            (m) => m.region.slug === accessedRegion.slug,
                          )
                          const relativeTime = formatRelativeTime(accessedRegion.lastAccessedDay)

                          return (
                            <li key={accessedRegion.slug} className="text-xs">
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
    </>
  )
}

AdminMembershipsPage.authenticate = { role: 'ADMIN' }
