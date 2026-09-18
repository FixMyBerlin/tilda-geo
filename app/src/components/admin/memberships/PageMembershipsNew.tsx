import { getRouteApi } from '@tanstack/react-router'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { MembershipForm } from './pageMemberships/MembershipForm'

const routeApi = getRouteApi('/admin/memberships/new')

export function PageMembershipsNew() {
  const { regions, users } = routeApi.useLoaderData()
  const { regionSlug, userId } = routeApi.useSearch()

  const regionId = regionSlug ? regions.find((r) => r.slug === regionSlug)?.id : undefined

  return (
    <>
      <AdminPageHeader
        title="Neue Mitgliedschaft"
        parent={{ label: 'Nutzer & Rechte', to: '/admin/memberships' }}
      />

      <MembershipForm
        regions={regions}
        users={users}
        initialValues={{
          userId: userId || undefined,
          regionId: regionId ? String(regionId) : undefined,
        }}
      />
    </>
  )
}
