import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'
import { adminBulletedListClassName } from '@/components/admin/adminClasses'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableDeleteButton } from '@/components/admin/AdminTableActions'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { formatDate } from '@/components/shared/date/formatDate'
import { formatRelativeTime } from '@/components/shared/date/relativeTime'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { deleteMembershipFn } from '@/server/memberships/memberships.functions'
import type { UserWithMemberships } from '@/server/users/queries/getUsersAndMemberships.server'
import { AccessedRegionsSection } from './AccessedRegionsSection'
import { getFullname } from './utils/getFullname'

type Props = {
  users: UserWithMemberships[]
  total: number
  /** Stable "30 days ago" timestamp (epoch ms) for the accessed-regions default filter. */
  accessedRegionsCutoffAt: number
  /** Rendered inside the table card (pagination). */
  footer?: React.ReactNode
}

export const AdminMembershipsTable = ({ users, total, accessedRegionsCutoffAt, footer }: Props) => {
  const router = useRouter()

  const removeMembership = useMutation({
    mutationFn: (id: number) => deleteMembershipFn({ data: { id } }),
    onSuccess: async () => {
      await router.invalidate()
      toastSuccess('Entfernt.')
    },
  })

  return (
    <AdminTable header={[`Nutzer (${total})`, 'Rechte']} footer={footer}>
      {users.map((user) => {
        return (
          <tr key={user.id}>
            <td className={twMerge(adminTableClasses.td, 'py-3 align-top')}>
              <strong className="font-medium text-gray-900">OSM: {user.osmName}</strong>{' '}
              <span className="text-gray-400">({user.osmId})</span>
              {user.role === 'ADMIN' && (
                <Pill color="pink" className="ml-1 bg-pink-300 text-pink-950 ring-0">
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
              {user?.memberships?.length === 0 ? (
                <AdminEmptyState bare>Bisher keine Rechte.</AdminEmptyState>
              ) : (
                <ul className={twMerge(adminBulletedListClassName, 'mt-0')}>
                  {user?.memberships?.map((membership) => {
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
                          <AdminTableActions>
                            <AdminTableDeleteButton
                              label={`Mitgliedschaft ${membership.region.slug} entfernen`}
                              title="Mitgliedschaft entfernen?"
                              description={`Die Mitgliedschaft auf „${membership.region.slug}“ wird entfernt. Der Benutzer-Account bleibt bestehen.`}
                              confirmLabel="Entfernen"
                              onDelete={async () => {
                                await removeMembership.mutateAsync(membership.id)
                              }}
                            />
                          </AdminTableActions>
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
              <AccessedRegionsSection
                user={user}
                accessedRegionsCutoffAt={accessedRegionsCutoffAt}
              />
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
