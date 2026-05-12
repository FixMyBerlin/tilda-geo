import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import {
  deleteStaticDatasetCategoryFn,
  updateStaticDatasetCategoryFn,
} from '@/server/static-dataset-categories/staticDatasetCategories.functions'
import { staticDatasetCategoryEditFormSchema } from '@/server/static-dataset-categories/staticDatasetCategoryFormSchema'
import { StaticDatasetCategoryForm } from './StaticDatasetCategoryForm'

const routeApi = getRouteApi('/admin/static-dataset-categories/$categoryKey')

export function PageStaticDatasetCategoryEdit() {
  const { category, relatedCategories } = routeApi.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const { href: editSelfHref } = router.buildLocation({
    to: '/admin/static-dataset-categories/$categoryKey',
    params: { categoryKey: category.key },
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: async (key: string) => {
      await deleteStaticDatasetCategoryFn({ data: { key } })
    },
    onSuccess: () => {
      navigate({ to: '/admin/static-dataset-categories' })
    },
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
            { href: '/admin/static-dataset-categories', name: 'Statische Datensatz-Kategorien' },
            {
              href: editSelfHref,
              name: 'Bearbeiten',
            },
          ]}
        />
      </HeaderWrapper>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Kategorie bearbeiten</h1>

        <StaticDatasetCategoryForm
          schema={staticDatasetCategoryEditFormSchema}
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
            try {
              await updateStaticDatasetCategoryFn({
                data: {
                  key: category.key,
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
