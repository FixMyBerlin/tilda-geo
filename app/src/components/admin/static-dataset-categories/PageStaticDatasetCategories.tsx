import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { StaticDatasetCategoriesTable } from './StaticDatasetCategoriesTable'

const routeApi = getRouteApi('/admin/static-dataset-categories/')

export function PageStaticDatasetCategories() {
  const { categories } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/static-dataset-categories', name: 'Statische Datensatz-Kategorien' },
          ]}
        />
      </HeaderWrapper>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Statische Datensatz-Kategorien</h1>
        <Link
          to="/admin/static-dataset-categories/new"
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
        <StaticDatasetCategoriesTable categories={categories} />
      )}
    </>
  )
}
