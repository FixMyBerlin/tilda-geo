import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminFirstPageLink, AdminPagination } from '@/components/admin/AdminPagination'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { AdminSearchField, useAdminSearchQuery } from '@/components/admin/AdminSearchField'
import { Link } from '@/components/shared/links/Link'
import { AdminMembershipsTable } from './pageMemberships/AdminMembershipsTable'

const routeApi = getRouteApi('/admin/memberships/')

export function PageMemberships() {
  const loaderData = routeApi.useLoaderData()
  const { page, regionSlug } = routeApi.useSearch()
  const query = useAdminSearchQuery()

  return (
    <>
      <AdminPageHeader
        title="Nutzer & Rechte"
        action={
          <Link to="/admin/memberships/new" search={{ regionSlug }} button>
            Neue Mitgliedschaft
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <AdminSearchField label="Nutzer durchsuchen" placeholder="Name, E-Mail oder Region …" />
        <AdminRegionFilter />
      </div>

      {loaderData.rows.length === 0 ? (
        <AdminEmptyState action={page > 1 ? <AdminFirstPageLink /> : undefined}>
          {query
            ? 'Keine Nutzer für diesen Filter.'
            : regionSlug
              ? 'Keine Mitglieder für diese Region.'
              : 'Noch keine Nutzer vorhanden.'}
        </AdminEmptyState>
      ) : (
        <AdminMembershipsTable
          users={loaderData.rows}
          total={loaderData.total}
          accessedRegionsCutoffAt={loaderData.accessedRegionsCutoffAt}
          footer={<AdminPagination pagination={loaderData} />}
        />
      )}
    </>
  )
}
