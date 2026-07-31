import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { AdminPageTitleEdit, AdminPageTitleEditLabel } from '@/components/admin/adminPageTitle'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { toastError } from '@/components/shared/toast/toastError'
import {
  deleteMapDatasetCategoryFn,
  updateMapDatasetCategoryFn,
} from '@/server/map-dataset-categories/mapDatasetCategories.functions'
import { mapDatasetCategoryFormSchema } from '@/server/map-dataset-categories/mapDatasetCategoryFormSchema'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'
import {
  MapDatasetCategoryForm,
  mapDatasetCategoryEditSubmitResult,
} from './MapDatasetCategoryForm'

const routeApi = getRouteApi('/admin/map-dataset-categories/$categoryKey')
const parentRouteApi = getRouteApi('/admin/map-dataset-categories')

export function PageMapDatasetCategoryEdit() {
  const { category, relatedCategories, auditHistory } = routeApi.useLoaderData()
  const { groupKey: listGroupKey } = parentRouteApi.useSearch()
  const listNavigateSearch = buildMapDatasetCategoriesListSearch(listGroupKey)
  const router = useRouter()
  const navigate = useNavigate()
  const { href: editSelfHref } = router.buildLocation({
    to: '/admin/map-dataset-categories/$categoryKey',
    params: { categoryKey: category.key },
    search: listNavigateSearch,
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: async (key: string) => {
      await deleteMapDatasetCategoryFn({ data: { key } })
    },
    onSuccess: () => {
      navigate({ to: '/admin/map-dataset-categories', search: listNavigateSearch })
    },
    onError: (error) => toastError(error, 'Kategorie konnte nicht gelöscht werden'),
  })

  const handleDelete = () => {
    const ok = window.confirm(
      `Sind Sie sicher, dass Sie die Kategorie „${category.key}“ löschen möchten? Uploads, die diesen Schlüssel noch nutzen, zeigen danach den Roh-Schlüssel in der Karte.`,
    )
    if (ok) remove(category.key)
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/map-dataset-categories', name: 'Statische Daten: Kategorien' },
            {
              href: editSelfHref,
              name: <AdminPageTitleEditLabel name={category.title} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <div className="space-y-4">
        <AdminPageTitleEdit name={category.title} />

        <MapDatasetCategoryForm
          schema={mapDatasetCategoryFormSchema}
          listGroupKey={listGroupKey}
          defaultValues={{
            groupKey: category.groupKey,
            categoryKey: category.categoryKey,
            sortOrder: String(category.sortOrder),
            title: category.title,
            subtitle: category.subtitle ?? '',
          }}
          variant="edit"
          categoryKey={category.key}
          relatedCategories={relatedCategories}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          onSubmit={async (values) => {
            const sort = Number.parseFloat(values.sortOrder.replace(',', '.'))
            const newKey = `${values.groupKey}/${values.categoryKey}`
            try {
              const result = await updateMapDatasetCategoryFn({
                data: {
                  key: category.key,
                  groupKey: values.groupKey,
                  categoryKey: values.categoryKey,
                  sortOrder: sort,
                  title: values.title,
                  subtitle: values.subtitle.trim() === '' ? null : values.subtitle,
                },
              })
              if (!result.ok) {
                if (result.error === 'duplicate_key') {
                  return mapDatasetCategoryEditSubmitResult({
                    success: false,
                    message: 'Dieser Kategorie-Schlüssel ist bereits vergeben.',
                    errors: { categoryKey: ['Schlüssel existiert bereits.'] },
                  })
                }
                return mapDatasetCategoryEditSubmitResult({
                  success: false,
                  message: 'Speichern fehlgeschlagen.',
                  errors: {},
                })
              }
              if (newKey !== category.key) {
                return mapDatasetCategoryEditSubmitResult({
                  success: true,
                  message: '',
                  errors: {},
                  navigateToCategoryKey: newKey,
                })
              }
              return mapDatasetCategoryEditSubmitResult({
                success: true,
                message: '',
                errors: {},
              })
            } catch {
              return mapDatasetCategoryEditSubmitResult({
                success: false,
                message: 'Speichern fehlgeschlagen.',
                errors: {},
              })
            }
          }}
        />

        <AuditHistoryPanel
          rows={auditHistory}
          model="MapDatasetCategory"
          recordId={String(category.id)}
        />
      </div>
    </>
  )
}
