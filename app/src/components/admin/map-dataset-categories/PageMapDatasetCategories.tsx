import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
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
      <HeaderWrapper>
        <Breadcrumb
          pages={[{ href: '/admin/map-dataset-categories', name: 'Statische Daten: Kategorien' }]}
        />
      </HeaderWrapper>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Statische Daten: Kategorien</h1>
        <Link
          to="/admin/map-dataset-categories/new"
          search={buildMapDatasetCategoriesListSearch(groupKey)}
          classNameOverwrite="inline-flex shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-gray-800"
        >
          Neue Kategorie
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="mt-6 text-gray-600">
          Noch keine Kategorien. Lege die erste über „Neue Kategorie“ an.
        </p>
      ) : (
        <>
          <div className="mt-6">
            <FilterRow
              items={filterItems}
              activeId={activeId}
              to="/admin/map-dataset-categories"
              buildSearch={buildMapDatasetCategoriesListSearch}
              ariaLabel="Gruppen"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="mt-6 text-gray-600">
              Keine Kategorien in der Gruppe „{groupKey}“. Wähle „Alle“ oder eine andere Gruppe.
            </p>
          ) : (
            <MapDatasetCategoriesTable categories={filtered} listGroupKey={groupKey} />
          )}
        </>
      )}
    </>
  )
}
