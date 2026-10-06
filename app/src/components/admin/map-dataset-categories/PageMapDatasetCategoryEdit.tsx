import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { deleteMapDatasetCategoryFn } from '@/server/map-dataset-categories/mapDatasetCategories.functions'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'
import { MapDatasetCategoryForm } from './MapDatasetCategoryForm'
import { MapDatasetCategorySiblingsSection } from './MapDatasetCategorySiblingsSection'

const routeApi = getRouteApi('/admin/map-dataset-categories/$categoryKey')
const parentRouteApi = getRouteApi('/admin/map-dataset-categories')

/** Sections after the `category` field group (`MapDatasetCategoryForm`). */
const pageSectionLabels = {
  siblings: 'Weitere Kategorien der Gruppe',
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageMapDatasetCategoryEdit() {
  const { category, relatedCategories, auditHistory } = routeApi.useLoaderData()
  const { groupKey: listGroupKey } = parentRouteApi.useSearch()
  const navigate = useNavigate()

  const deleteCategory = useMutation({
    mutationFn: async () => {
      await deleteMapDatasetCategoryFn({ data: { key: category.key } })
    },
    onSuccess: async () => {
      toastSuccess('Gelöscht.')
      await navigate({
        to: '/admin/map-dataset-categories',
        search: buildMapDatasetCategoriesListSearch(listGroupKey),
      })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={category.title}
        parent={{ label: 'Statische Daten: Kategorien', to: '/admin/map-dataset-categories' }}
      />

      <MapDatasetCategoryForm
        // Remount on rename — the route stays mounted across a `$categoryKey` param change, so
        // `useForm` would otherwise keep the stale defaultValues from the previous key.
        key={category.key}
        mode="edit"
        categoryKey={category.key}
        listGroupKey={listGroupKey}
        initialValues={{
          groupKey: category.groupKey,
          categoryKey: category.categoryKey,
          sortOrder: String(category.sortOrder),
          title: category.title,
          subtitle: category.subtitle ?? '',
        }}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <>
              <MapDatasetCategorySiblingsSection
                id="siblings"
                title={pageSectionLabels.siblings}
                groupKey={category.groupKey}
                rows={relatedCategories}
              />
              <AuditHistoryPanel
                id="history"
                rows={auditHistory}
                model="MapDatasetCategory"
                recordId={String(category.id)}
              />
              <AdminTechnicalDetails
                id="technical"
                items={[
                  { label: 'ID', value: category.id },
                  { label: 'Schlüssel', value: <code>{category.key}</code> },
                ]}
                dumps={[{ title: 'Kategorie', data: category }]}
              />
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Kategorie löschen"
              title={`Kategorie „${category.title}“ löschen?`}
              description="Uploads, die diesen Schlüssel noch nutzen, zeigen danach den Roh-Schlüssel in der Karte."
              onDelete={() => deleteCategory.mutateAsync()}
            />
          ),
        }}
      />
    </>
  )
}
