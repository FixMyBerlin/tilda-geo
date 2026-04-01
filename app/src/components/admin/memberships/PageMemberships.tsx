import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { AdminMembershipsTable } from './pageMemberships/AdminMembershipsTable'

const routeApi = getRouteApi('/admin/memberships/')
const MAX_TAKE = 1000

export function PageMemberships() {
  const { users } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[{ href: '/admin/memberships', name: 'Nutzer:innen & Mitgliedschaften' }]}
        />
      </HeaderWrapper>

      {users.length >= MAX_TAKE && (
        <p className="my-12 text-red-500">
          Achtung, die Liste zeigt maximal {MAX_TAKE} Einträge. Wir müssen eine Paginierung bauen
          oder `maxTake` erhöhen.
        </p>
      )}

      <AdminMembershipsTable users={users} />
    </>
  )
}
