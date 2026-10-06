import { getRouteApi } from '@tanstack/react-router'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  MapDatasetCategoryForm,
  MapDatasetCategoryFormInputDefaults,
} from './MapDatasetCategoryForm'

const routeApi = getRouteApi('/admin/map-dataset-categories')

export function PageMapDatasetCategoryNew() {
  const { groupKey } = routeApi.useSearch()

  return (
    <>
      <AdminPageHeader
        title="Neue Kategorie"
        parent={{ label: 'Statische Daten: Kategorien', to: '/admin/map-dataset-categories' }}
      />

      <MapDatasetCategoryForm
        mode="create"
        listGroupKey={groupKey}
        initialValues={{
          groupKey: groupKey ?? MapDatasetCategoryFormInputDefaults.groupKey,
          categoryKey: MapDatasetCategoryFormInputDefaults.categoryKey,
          sortOrder: MapDatasetCategoryFormInputDefaults.sortOrder,
          title: MapDatasetCategoryFormInputDefaults.title,
          subtitle: MapDatasetCategoryFormInputDefaults.subtitle,
        }}
      />
    </>
  )
}
