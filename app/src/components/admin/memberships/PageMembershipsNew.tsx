import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { MembershipForm } from './pageMemberships/MembershipForm'

const routeApi = getRouteApi('/admin/memberships/new')

export function PageMembershipsNew() {
  const { regions, users } = routeApi.useLoaderData()
  const { regionSlug, userId } = routeApi.useSearch()

  const regionId = regionSlug ? regions.find((r) => r.slug === regionSlug)?.id : undefined

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/memberships', name: 'Nutzer:innen & Mitgliedschaften' },
            { href: '/admin/memberships/new', name: 'Anlegen' },
          ]}
        />
      </HeaderWrapper>
      <MembershipForm
        regions={regions}
        users={users}
        initialValues={{
          userId: userId || undefined,
          regionId: regionId ? String(regionId) : undefined,
        }}
        submitLabel="Erstellen"
      />
    </>
  )
}
