import { getRouteApi } from '@tanstack/react-router'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
import { MapDatasetUploadsTable } from './pageMapDatasetUploads/MapDatasetUploadsTable'

const routeApi = getRouteApi('/admin/map-dataset-uploads/')

export function PageMapDatasetUploads() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { page, goToPage, result } = useAdminTablePagination(search, navigate, loaderData)

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/map-dataset-uploads', name: 'Uploads' }]} />
      </HeaderWrapper>

      <div className={adminTableClasses.paginatedShell}>
        <MapDatasetUploadsTable uploads={loaderData.rows} />
        <PaginationControls page={page} result={result} onPageChange={goToPage} />
      </div>
    </>
  )
}
