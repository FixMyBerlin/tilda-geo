import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminFirstPageLink, AdminPagination } from '@/components/admin/AdminPagination'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { AdminSearchField } from '@/components/admin/AdminSearchField'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import { resolveUploadKind } from '@/lib/mapDatasetUploadsSearchSchema'
import { buildMapDatasetUploadKindFilterItems } from './pageMapDatasetUploads/buildMapDatasetUploadKindFilterItems'
import { buildUploadsListSearch } from './pageMapDatasetUploads/mapDatasetUploadsListSearch'
import { MapDatasetUploadsTable } from './pageMapDatasetUploads/MapDatasetUploadsTable'

const routeApi = getRouteApi('/admin/map-dataset-uploads/')

export function PageMapDatasetUploads() {
  const loaderData = routeApi.useLoaderData()
  const search = routeApi.useSearch()

  const activeKind = resolveUploadKind(search.kind)
  const filterItems = buildMapDatasetUploadKindFilterItems(loaderData.kindCounts)
  const regionSlug = search.regionSlug?.trim() || undefined
  const hasActiveFilter = activeKind === 'system' || Boolean(regionSlug) || Boolean(search.q)

  return (
    <>
      <AdminPageHeader title="Uploads" />

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <AdminSearchField label="Uploads durchsuchen" placeholder="Slug oder Ansicht …" />
          <AdminRegionFilter />
        </div>
        <FilterRow
          items={filterItems}
          activeId={activeKind}
          to="/admin/map-dataset-uploads"
          label="Art"
          buildSearch={(id) =>
            buildUploadsListSearch({
              kind: id,
              regionSlug,
              q: search.q,
              pageSize: search.pageSize,
            })
          }
          ariaLabel="Art"
        />
      </div>

      {loaderData.rows.length === 0 ? (
        <AdminEmptyState action={search.page > 1 ? <AdminFirstPageLink /> : undefined}>
          {regionSlug && !search.q && activeKind === 'datasets'
            ? 'Keine Uploads für diese Region.'
            : hasActiveFilter
              ? 'Keine Uploads für diesen Filter.'
              : 'Noch keine Uploads vorhanden.'}
        </AdminEmptyState>
      ) : (
        <MapDatasetUploadsTable
          uploads={loaderData.rows}
          listKind={search.kind}
          footer={<AdminPagination pagination={loaderData} />}
        />
      )}
    </>
  )
}
