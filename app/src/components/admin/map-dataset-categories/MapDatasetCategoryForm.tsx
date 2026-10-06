import { useNavigate, useRouter } from '@tanstack/react-router'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import {
  createMapDatasetCategoryFn,
  updateMapDatasetCategoryFn,
} from '@/server/map-dataset-categories/mapDatasetCategories.functions'
import {
  STATIC_DATASET_CATEGORY_SUBTITLE_MAX,
  STATIC_DATASET_CATEGORY_TITLE_MAX,
} from '@/server/map-dataset-categories/mapDatasetCategoryDisplayLimits'
import {
  mapDatasetCategoryFormSchema,
  type MapDatasetCategoryFormValues,
} from '@/server/map-dataset-categories/mapDatasetCategoryFormSchema'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'

export const MapDatasetCategoryFormInputDefaults = {
  groupKey: '',
  categoryKey: '',
  sortOrder: '1',
  title: '',
  subtitle: '',
} as const satisfies MapDatasetCategoryFormValues

function mergedCategoryKey(groupKey: string, categoryKey: string) {
  const g = groupKey.trim()
  const c = categoryKey.trim()
  if (!g || !c) return ''
  return `${g}/${c}`
}

/** Section id (jump list + URL hash) and title of the single field group. */
const sectionLabels = {
  category: 'Kategorie',
} satisfies Record<string, string>

type Props = {
  listGroupKey?: string
  pageExtras?: AdminFormPageExtras
} & (
  | { mode: 'create'; initialValues: MapDatasetCategoryFormValues }
  | { mode: 'edit'; initialValues: MapDatasetCategoryFormValues; categoryKey: string }
)

export function MapDatasetCategoryForm(props: Props) {
  const { mode, initialValues, listGroupKey, pageExtras } = props
  const navigate = useNavigate()
  const router = useRouter()
  const cancelSearch = buildMapDatasetCategoriesListSearch(listGroupKey)

  return (
    <Form<MapDatasetCategoryFormValues>
      actionBarPlacement="none"
      defaultValues={initialValues}
      schema={mapDatasetCategoryFormSchema}
      onSubmit={async (values) => {
        const sortOrder = Number.parseFloat(values.sortOrder.replace(',', '.'))
        const subtitle = values.subtitle.trim() === '' ? null : values.subtitle

        if (mode === 'create') {
          try {
            await createMapDatasetCategoryFn({
              data: {
                groupKey: values.groupKey,
                categoryKey: values.categoryKey,
                sortOrder,
                title: values.title,
                subtitle,
              },
            })
          } catch {
            return {
              success: false,
              message: 'Speichern fehlgeschlagen.',
            } satisfies SubmitResult<MapDatasetCategoryFormValues>
          }
          return {
            success: true,
            message: 'Angelegt.',
            redirect: '/admin/map-dataset-categories',
            search: buildMapDatasetCategoriesListSearch(values.groupKey),
          } satisfies SubmitResult<MapDatasetCategoryFormValues>
        }

        const newKey = `${values.groupKey}/${values.categoryKey}`
        const result = await updateMapDatasetCategoryFn({
          data: {
            key: props.categoryKey,
            groupKey: values.groupKey,
            categoryKey: values.categoryKey,
            sortOrder,
            title: values.title,
            subtitle,
          },
        })
        if (!result.ok) {
          if (result.error === 'duplicate_key') {
            return {
              success: false,
              message: 'Dieser Kategorie-Schlüssel ist bereits vergeben.',
              errors: { categoryKey: ['Schlüssel existiert bereits.'] },
            } satisfies SubmitResult<MapDatasetCategoryFormValues>
          }
          return {
            success: false,
            message: 'Speichern fehlgeschlagen.',
          } satisfies SubmitResult<MapDatasetCategoryFormValues>
        }
        await router.invalidate()
        if (newKey !== props.categoryKey) {
          await navigate({
            to: '/admin/map-dataset-categories/$categoryKey',
            params: { categoryKey: newKey },
            search: cancelSearch,
          })
        }
        return { success: true } satisfies SubmitResult<MapDatasetCategoryFormValues>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel={mode === 'create' ? 'Erstellen' : 'Speichern'}
          cancel={{ to: '/admin/map-dataset-categories', search: cancelSearch }}
          submitError={submitError}
        >
          <AdminFormSection
            id="category"
            title={sectionLabels.category}
            description={
              mode === 'edit'
                ? 'Änderungen an Gruppe oder Kategorie setzen einen neuen Kategorie-Schlüssel. Bereits konfigurierte Uploads behalten den bisherigen Schlüssel — passen Sie die Upload-Daten bei Bedarf manuell an.'
                : undefined
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="groupKey"
                label="Gruppe"
                maxLength={190}
                placeholder="z. B. bb"
                autoComplete="off"
              />
              <TextField
                form={form}
                name="categoryKey"
                label="Kategorie"
                maxLength={190}
                placeholder="z. B. Netzkonzeption"
                autoComplete="off"
              />
            </div>

            <form.Subscribe
              selector={(state) => [state.values.groupKey, state.values.categoryKey] as const}
            >
              {([groupKey, categoryKey]) => {
                const preview = mergedCategoryKey(groupKey, categoryKey)
                return preview ? (
                  <output htmlFor="groupKey categoryKey" className="block text-sm text-gray-600">
                    Vollständiger Schlüssel für Uploads:{' '}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                      {preview}
                    </code>
                  </output>
                ) : null
              }}
            </form.Subscribe>

            <TextField form={form} name="sortOrder" label="Sortierung" type="number" step="any" />
            <TextField
              form={form}
              name="title"
              label="Titel"
              maxLength={STATIC_DATASET_CATEGORY_TITLE_MAX}
            />
            <Textarea
              form={form}
              name="subtitle"
              label="Untertitel"
              optional
              rows={4}
              maxLength={STATIC_DATASET_CATEGORY_SUBTITLE_MAX}
            />
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
