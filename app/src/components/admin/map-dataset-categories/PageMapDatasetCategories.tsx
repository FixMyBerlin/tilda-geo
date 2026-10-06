import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { FilterRow } from '@/components/shared/FilterRow/FilterRow'
import { Link } from '@/components/shared/links/Link'
import { buildMapDatasetCategoryFilterItems } from './buildMapDatasetCategoryFilterItems'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'
import { MapDatasetCategoriesTable } from './MapDatasetCategoriesTable'

const routeApi = getRouteApi('/admin/map-dataset-categories/')
const parentRouteApi = getRouteApi('/admin/map-dataset-categories')

export function PageMapDatasetCategories() {
  const { categories } = routeApi.useLoaderData()
  const { groupKey } = parentRouteApi.useSearch()

  const filterItems = buildMapDatasetCategoryFilterItems(categories)
  const activeId = groupKey ?? ''
  const knownGroupKeys = new Set(categories.map((c) => c.groupKey))
  const filtered =
    groupKey && knownGroupKeys.has(groupKey)
      ? categories.filter((c) => c.groupKey === groupKey)
      : groupKey
        ? []
        : categories

  return (
    <>
      <AdminPageHeader
        title="Statische Daten: Kategorien"
        action={
          <Link
            to="/admin/map-dataset-categories/new"
            search={buildMapDatasetCategoriesListSearch(groupKey)}
            button
          >
            Neue Kategorie
          </Link>
        }
      />

      {categories.length === 0 ? (
        <AdminEmptyState>
          Noch keine Kategorien. Lege die erste über „Neue Kategorie“ an.
        </AdminEmptyState>
      ) : (
        <>
          <div className="mb-6">
            <FilterRow
              items={filterItems}
              activeId={activeId}
              to="/admin/map-dataset-categories"
              buildSearch={buildMapDatasetCategoriesListSearch}
              ariaLabel="Gruppen"
            />
          </div>
          {filtered.length === 0 ? (
            <AdminEmptyState>Keine Kategorien in der Gruppe „{groupKey}“.</AdminEmptyState>
          ) : (
            <MapDatasetCategoriesTable categories={filtered} listGroupKey={groupKey} />
          )}
        </>
      )}
    </>
  )
}
