import { getRouteApi } from '@tanstack/react-router'
import { AdminPageTitleNew, AdminPageTitleNewLabel } from '@/components/admin/adminPageTitle'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { createMapDatasetCategoryFn } from '@/server/map-dataset-categories/mapDatasetCategories.functions'
import { mapDatasetCategoryFormSchema } from '@/server/map-dataset-categories/mapDatasetCategoryFormSchema'
import {
  MapDatasetCategoryForm,
  MapDatasetCategoryFormInputDefaults,
} from './MapDatasetCategoryForm'

const routeApi = getRouteApi('/admin/map-dataset-categories')

export function PageMapDatasetCategoryNew() {
  const { groupKey } = routeApi.useSearch()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/map-dataset-categories', name: 'Statische Daten: Kategorien' },
            {
              href: '/admin/map-dataset-categories/new',
              name: <AdminPageTitleNewLabel label="Neue Kategorie" variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <div className="space-y-4">
        <AdminPageTitleNew label="Neue Kategorie" />

        <MapDatasetCategoryForm
          schema={mapDatasetCategoryFormSchema}
          listGroupKey={groupKey}
          defaultValues={{
            groupKey: groupKey ?? MapDatasetCategoryFormInputDefaults.groupKey,
            categoryKey: MapDatasetCategoryFormInputDefaults.categoryKey,
            sortOrder: MapDatasetCategoryFormInputDefaults.sortOrder,
            title: MapDatasetCategoryFormInputDefaults.title,
            subtitle: MapDatasetCategoryFormInputDefaults.subtitle,
          }}
          variant="create"
          onSubmit={async (values) => {
            const sort = Number.parseFloat(values.sortOrder.replace(',', '.'))
            try {
              await createMapDatasetCategoryFn({
                data: {
                  groupKey: values.groupKey,
                  categoryKey: values.categoryKey,
                  sortOrder: sort,
                  title: values.title,
                  subtitle: values.subtitle.trim() === '' ? null : values.subtitle,
                },
              })
              return { success: true, message: '', errors: {} }
            } catch {
              return { success: false, message: 'Speichern fehlgeschlagen.', errors: {} }
            }
          }}
        />
      </div>
    </>
  )
}
