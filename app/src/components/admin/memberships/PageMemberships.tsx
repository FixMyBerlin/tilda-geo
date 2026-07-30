import { getRouteApi } from '@tanstack/react-router'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
import { AdminMembershipsTable } from './pageMemberships/AdminMembershipsTable'

const routeApi = getRouteApi('/admin/memberships/')

export function PageMemberships() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { page, goToPage, result } = useAdminTablePagination(search, navigate, loaderData)

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[{ href: '/admin/memberships', name: 'Nutzer:innen & Mitgliedschaften' }]}
        />
      </HeaderWrapper>

      <div className={adminTableClasses.paginatedShell}>
        <AdminMembershipsTable users={loaderData.rows} total={loaderData.total} />
        <PaginationControls page={page} result={result} onPageChange={goToPage} />
      </div>
    </>
  )
}
