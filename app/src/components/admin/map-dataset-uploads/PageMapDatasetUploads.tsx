import { getRouteApi } from '@tanstack/react-router'
import { adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import { Link } from '@/components/shared/links/Link'
import { PaginationControls } from '@/components/shared/pagination/PaginationControls'
import { useAdminTablePagination } from '@/components/shared/pagination/useAdminTablePagination'
import { Pill } from '@/components/shared/text/Pill'
import { resolveUploadKind } from '@/lib/mapDatasetUploadsSearchSchema'
import { buildMapDatasetUploadKindFilterItems } from './pageMapDatasetUploads/buildMapDatasetUploadKindFilterItems'
import { buildUploadsListSearch } from './pageMapDatasetUploads/mapDatasetUploadsListSearch'
import { MapDatasetUploadsTable } from './pageMapDatasetUploads/MapDatasetUploadsTable'

const routeApi = getRouteApi('/admin/map-dataset-uploads/')

export function PageMapDatasetUploads() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { page, goToPage, result } = useAdminTablePagination(search, navigate, loaderData)

  const activeKind = resolveUploadKind(search.kind)
  const filterItems = buildMapDatasetUploadKindFilterItems(loaderData.kindCounts)
  const regionSlug = search.regionSlug?.trim() || undefined

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/map-dataset-uploads', name: 'Uploads' }]} />
      </HeaderWrapper>

      <div className="mb-4 flex flex-col gap-3">
        <FilterRow
          items={filterItems}
          activeId={activeKind}
          to="/admin/map-dataset-uploads"
          label="Art"
          buildSearch={(id) =>
            buildUploadsListSearch({
              kind: id,
              regionSlug,
              take: search.take,
            })
          }
          ariaLabel="Art"
        />
        {regionSlug ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Region:</span>
            <Pill color="blue">{regionSlug}</Pill>
            <Link
              to="/admin/map-dataset-uploads"
              search={buildUploadsListSearch({ kind: search.kind, take: search.take })}
              className="text-sm"
            >
              Alle Regionen
            </Link>
          </div>
        ) : null}
      </div>

      <div className={adminTableClasses.paginatedShell}>
        <MapDatasetUploadsTable uploads={loaderData.rows} listKind={search.kind} />
        <PaginationControls page={page} result={result} onPageChange={goToPage} />
      </div>
    </>
  )
}
