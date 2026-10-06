import { ClockIcon, PlusIcon, UsersIcon } from '@heroicons/react/20/solid'
import { getRouteApi } from '@tanstack/react-router'
import { AdminDescriptionList } from '@/components/admin/AdminDescriptionList'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { AdminAsideLink } from '@/components/admin/aside/AdminAsideActions'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { formatUserNameWithOsmHandle } from '@/components/admin/memberships/pageMemberships/utils/formatUserName'
import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import { formatDate } from '@/components/shared/date/formatDate'
import { formatRelativeTime } from '@/components/shared/date/relativeTime'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { UserRoleForm } from './UserRoleForm'

const routeApi = getRouteApi('/admin/users/$userId/edit')

/** Sections after the role form field group (`UserRoleForm`). */
const pageSectionLabels = {
  profile: 'Profil',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageUserEdit() {
  const { user, linkCounts } = routeApi.useLoaderData()
  const userLabel = formatUserNameWithOsmHandle(user) || user.id

  return (
    <>
      <AdminPageHeader
        title={userLabel}
        parent={{ label: 'Nutzer & Rechte', to: '/admin/users' }}
      />

      <UserRoleForm
        user={user}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <>
              <AdminFormSection id="profile" title={pageSectionLabels.profile}>
                <AdminDescriptionList
                  items={[
                    { label: 'OSM-Name', value: `${user.osmName ?? '–'} (${user.osmId})` },
                    { label: 'Name', value: getFullname(user) },
                    { label: 'E-Mail', value: hasContactEmail(user.email) ? user.email : null },
                    {
                      label: 'Registriert',
                      value: `${formatDate(user.createdAt)} (${formatRelativeTime(user.createdAt)})`,
                    },
                  ]}
                />
              </AdminFormSection>
              <AdminTechnicalDetails
                id="technical"
                items={[
                  { label: 'ID', value: <code>{user.id}</code> },
                  { label: 'Rolle', value: <code>{user.role}</code> },
                ]}
                dumps={[{ title: 'User', data: user }]}
              />
            </>
          ),
          secondaryActions: (
            <>
              {/* Email is unique, so the list search narrows to this user (memberships, opened regions). */}
              <AdminAsideLink
                icon={UsersIcon}
                to="/admin/users"
                search={{ q: user.email }}
                count={linkCounts.memberships}
              >
                Mitgliedschaften
              </AdminAsideLink>
              <AdminAsideLink
                icon={PlusIcon}
                to="/admin/memberships/new"
                search={{ userId: user.id }}
              >
                Mitgliedschaft hinzufügen
              </AdminAsideLink>
              <AdminAsideLink
                icon={ClockIcon}
                to="/admin/audit-log"
                search={{ model: 'User', recordId: user.id }}
                count={linkCounts.auditHistory}
              >
                Änderungsverlauf
              </AdminAsideLink>
              <AdminAsideLink icon={ClockIcon} to="/admin/audit-log" search={{ userId: user.id }}>
                Änderungen durch diesen User
              </AdminAsideLink>
            </>
          ),
        }}
      />
    </>
  )
}
