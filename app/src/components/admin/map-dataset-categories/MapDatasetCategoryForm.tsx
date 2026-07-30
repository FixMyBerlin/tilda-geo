import { useNavigate } from '@tanstack/react-router'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { FormActionBar } from '@/components/shared/form/FormActionBar'
import type { FormApi } from '@/components/shared/form/types'
import { buttonStyles, buttonStylesSecondary } from '@/components/shared/links/styles'
import {
  STATIC_DATASET_CATEGORY_SUBTITLE_MAX,
  STATIC_DATASET_CATEGORY_TITLE_MAX,
} from '@/server/map-dataset-categories/mapDatasetCategoryDisplayLimits'
import type {
  mapDatasetCategoryFormSchema,
  MapDatasetCategoryFormValues,
} from '@/server/map-dataset-categories/mapDatasetCategoryFormSchema'
import type { FormState } from '@/server/utils/validation'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'
import {
  MapDatasetCategorySiblingsPanel,
  type StaticDatasetSiblingRow,
} from './MapDatasetCategorySiblingsPanel'

export type MapDatasetCategoryEditSubmitResult =
  | FormState
  | {
      success: true
      message: string
      errors: Record<string, never>
      navigateToCategoryKey: string
    }

export function mapDatasetCategoryEditSubmitResult(result: MapDatasetCategoryEditSubmitResult) {
  return result
}

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

function mapFormStateToSubmitResult(result: FormState | undefined, savedGroupKey?: string) {
  if (result?.success) {
    return {
      success: true,
      redirect: '/admin/map-dataset-categories',
      search: buildMapDatasetCategoriesListSearch(savedGroupKey),
    } satisfies SubmitResult<MapDatasetCategoryFormValues>
  }
  if (result && !result.success) {
    return {
      success: false,
      message: result.message,
      errors: result.errors,
    } satisfies SubmitResult<MapDatasetCategoryFormValues>
  }
  return undefined
}

type CategoryFormLayoutProps =
  | {
      form: FormApi<MapDatasetCategoryFormValues>
      variant: 'create'
      navigate: ReturnType<typeof useNavigate>
      listGroupKey?: string
    }
  | {
      form: FormApi<MapDatasetCategoryFormValues>
      variant: 'edit'
      navigate: ReturnType<typeof useNavigate>
      listGroupKey?: string
      relatedCategories: StaticDatasetSiblingRow[]
      onDelete: () => void
      isDeleting: boolean
    }

function CategoryFormLayout(props: CategoryFormLayoutProps) {
  const { form, variant, navigate, listGroupKey } = props
  const isEdit = variant === 'edit'
  const isDeleting = isEdit ? props.isDeleting : false
  const cancelListSearch = buildMapDatasetCategoriesListSearch(listGroupKey)

  const mainColumn = (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(isSubmitting) => {
        const actionBarLeft = (
          <button
            type="submit"
            disabled={isSubmitting || (isEdit && isDeleting)}
            className={buttonStyles}
          >
            {isSubmitting ? '…' : 'Speichern'}
          </button>
        )
        const actionBarRight = isEdit ? (
          <>
            <button
              type="button"
              disabled={isSubmitting || isDeleting}
              className={buttonStylesSecondary}
              onClick={() =>
                navigate({
                  to: '/admin/map-dataset-categories',
                  search: cancelListSearch,
                })
              }
            >
              Abbrechen
            </button>
            <AdminTrashIconButton
              ariaLabel="Statische Daten: Kategorie löschen"
              disabled={isDeleting}
              size="comfortable"
              onClick={() => {
                if (props.variant === 'edit') props.onDelete()
              }}
            />
          </>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            className={buttonStylesSecondary}
            onClick={() =>
              navigate({
                to: '/admin/map-dataset-categories',
                search: cancelListSearch,
              })
            }
          >
            Abbrechen
          </button>
        )

        return (
          <div className="min-w-0 space-y-4">
            <FormActionBar left={actionBarLeft} right={actionBarRight} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="groupKey"
                label="Gruppe"
                maxLength={190}
                placeholder="z. B. bb"
                autoComplete="off"
                disabled={isSubmitting || (isEdit && isDeleting)}
                className="max-w-full"
              />
              <TextField
                form={form}
                name="categoryKey"
                label="Kategorie"
                maxLength={190}
                placeholder="z. B. Netzkonzeption"
                autoComplete="off"
                disabled={isSubmitting || (isEdit && isDeleting)}
                className="max-w-full"
              />
            </div>

            {isEdit ? (
              <p className="text-sm text-gray-600">
                Hinweis: Änderungen an Gruppe oder Kategorie setzen einen neuen Kategorie-Schlüssel.
                Bereits konfigurierte Uploads behalten den bisherigen Schlüssel — passen Sie die
                Upload-Daten bei Bedarf manuell an.
              </p>
            ) : null}

            <form.Subscribe selector={(s) => [s.values.groupKey, s.values.categoryKey] as const}>
              {([gk, ck]) => {
                const preview = mergedCategoryKey(gk, ck)
                return preview ? (
                  <p className="text-sm text-gray-600">
                    Vollständiger Schlüssel für Uploads:{' '}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
                      {preview}
                    </code>
                  </p>
                ) : null
              }}
            </form.Subscribe>

            <TextField
              form={form}
              name="sortOrder"
              label="Sortierung"
              type="number"
              step="any"
              disabled={isSubmitting || (isEdit && isDeleting)}
              className="max-w-full"
            />
            <TextField
              form={form}
              name="title"
              label="Titel"
              maxLength={STATIC_DATASET_CATEGORY_TITLE_MAX}
              disabled={isSubmitting || (isEdit && isDeleting)}
              className="max-w-full"
            />
            <Textarea
              form={form}
              name="subtitle"
              label="Untertitel"
              optional
              rows={4}
              maxLength={STATIC_DATASET_CATEGORY_SUBTITLE_MAX}
              disabled={isSubmitting || (isEdit && isDeleting)}
              className="max-w-full"
            />

            <FormActionBar className="mt-6" left={actionBarLeft} right={actionBarRight} />
          </div>
        )
      }}
    </form.Subscribe>
  )

  if (!isEdit) {
    return <div className="max-w-6xl min-w-0">{mainColumn}</div>
  }

  const { relatedCategories } = props

  return (
    <div className="grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
      {mainColumn}
      <form.Subscribe selector={(s) => s.values.groupKey}>
        {(groupKey) => (
          <MapDatasetCategorySiblingsPanel groupKey={groupKey} rows={relatedCategories} />
        )}
      </form.Subscribe>
    </div>
  )
}

type MapDatasetCategoryFormProps =
  | {
      schema: typeof mapDatasetCategoryFormSchema
      defaultValues: MapDatasetCategoryFormValues
      onSubmit: (values: MapDatasetCategoryFormValues) => Promise<FormState | undefined>
      variant: 'create'
      listGroupKey?: string
    }
  | {
      schema: typeof mapDatasetCategoryFormSchema
      defaultValues: MapDatasetCategoryFormValues
      onSubmit: (
        values: MapDatasetCategoryFormValues,
      ) => Promise<MapDatasetCategoryEditSubmitResult | undefined>
      variant: 'edit'
      categoryKey: string
      listGroupKey?: string
      relatedCategories: StaticDatasetSiblingRow[]
      onDelete: () => void
      isDeleting: boolean
    }

export function MapDatasetCategoryForm(props: MapDatasetCategoryFormProps) {
  const navigate = useNavigate()

  if (props.variant === 'create') {
    return (
      <Form<MapDatasetCategoryFormValues>
        key="create"
        defaultValues={props.defaultValues}
        schema={props.schema}
        showFormErrors
        className="min-w-0 space-y-4"
        onSubmit={async (values) => {
          const result = await props.onSubmit(values)
          return mapFormStateToSubmitResult(result, values.groupKey)
        }}
      >
        {(form) => (
          <CategoryFormLayout
            form={form}
            variant="create"
            navigate={navigate}
            listGroupKey={props.listGroupKey}
          />
        )}
      </Form>
    )
  }

  return (
    <Form<MapDatasetCategoryFormValues>
      key={props.categoryKey}
      defaultValues={props.defaultValues}
      schema={props.schema}
      showFormErrors
      className="min-w-0 space-y-4"
      onSubmit={async (values) => {
        const result = await props.onSubmit(values)
        if (
          result &&
          'navigateToCategoryKey' in result &&
          typeof result.navigateToCategoryKey === 'string'
        ) {
          navigate({
            to: '/admin/map-dataset-categories/$categoryKey',
            params: { categoryKey: result.navigateToCategoryKey },
            search: buildMapDatasetCategoriesListSearch(props.listGroupKey),
          })
          return {
            success: true,
            message: result.message || 'Gespeichert.',
          } satisfies SubmitResult<MapDatasetCategoryFormValues>
        }
        return mapFormStateToSubmitResult(result, values.groupKey)
      }}
    >
      {(form) => (
        <CategoryFormLayout
          form={form}
          variant="edit"
          navigate={navigate}
          listGroupKey={props.listGroupKey}
          relatedCategories={props.relatedCategories}
          onDelete={props.onDelete}
          isDeleting={props.isDeleting}
        />
      )}
    </Form>
  )
}
