import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { createStaticDatasetCategoryFn } from '@/server/static-dataset-categories/staticDatasetCategories.functions'
import { staticDatasetCategoryCreateFormSchema } from '@/server/static-dataset-categories/staticDatasetCategoryFormSchema'
import {
  StaticDatasetCategoryForm,
  StaticDatasetCategoryFormInputDefaults,
} from './StaticDatasetCategoryForm'

const routeApi = getRouteApi('/admin/static-dataset-categories')

export function PageStaticDatasetCategoryNew() {
  const { groupKey } = routeApi.useSearch()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/static-dataset-categories', name: 'Statische Datensatz-Kategorien' },
            { href: '/admin/static-dataset-categories/new', name: 'Neu' },
          ]}
        />
      </HeaderWrapper>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Neue Kategorie</h1>

        <StaticDatasetCategoryForm
          schema={staticDatasetCategoryCreateFormSchema}
          listGroupKey={groupKey}
          defaultValues={{
            groupKey: groupKey ?? StaticDatasetCategoryFormInputDefaults.groupKey,
            categoryKey: StaticDatasetCategoryFormInputDefaults.categoryKey,
            sortOrder: StaticDatasetCategoryFormInputDefaults.sortOrder,
            title: StaticDatasetCategoryFormInputDefaults.title,
            subtitle: StaticDatasetCategoryFormInputDefaults.subtitle,
          }}
          variant="create"
          onSubmit={async (values) => {
            const sort = Number.parseFloat(values.sortOrder.replace(',', '.'))
            try {
              await createStaticDatasetCategoryFn({
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
