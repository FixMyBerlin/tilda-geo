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
} from '@/server/static-dataset-categories/staticDatasetCategoryDisplayLimits'
import type {
  staticDatasetCategoryCreateFormSchema,
  staticDatasetCategoryEditFormSchema,
  StaticDatasetCategoryCreateFormValues,
  StaticDatasetCategoryEditFormValues,
} from '@/server/static-dataset-categories/staticDatasetCategoryFormSchema'
import type { FormState } from '@/server/utils/validation'
import {
  StaticDatasetCategorySiblingsPanel,
  type StaticDatasetSiblingRow,
} from './StaticDatasetCategorySiblingsPanel'

export type StaticDatasetCategoryEditSubmitResult =
  | FormState
  | {
      success: true
      message: string
      errors: Record<string, never>
      navigateToCategoryKey: string
    }

export function staticDatasetCategoryEditSubmitResult(
  result: StaticDatasetCategoryEditSubmitResult,
) {
  return result
}

export const StaticDatasetCategoryFormInputDefaults = {
  groupKey: '',
  categoryKey: '',
  sortOrder: '1',
  title: '',
  subtitle: '',
} as const

type CategoryFormFieldValues = {
  groupKey: string
  categoryKey: string
  sortOrder: string
  title: string
  subtitle: string
}

function mergedCategoryKey(groupKey: string, categoryKey: string) {
  const g = groupKey.trim()
  const c = categoryKey.trim()
  if (!g || !c) return ''
  return `${g}/${c}`
}

function mapFormStateToSubmitResult(result: FormState | undefined) {
  if (result?.success) {
    return {
      success: true,
      redirect: '/admin/static-dataset-categories',
    } satisfies SubmitResult<CategoryFormFieldValues>
  }
  if (result && !result.success) {
    return {
      success: false,
      message: result.message,
      errors: result.errors,
    } satisfies SubmitResult<CategoryFormFieldValues>
  }
  return undefined
}

type CategoryFormLayoutProps =
  | {
      form: FormApi<CategoryFormFieldValues>
      variant: 'create'
      navigate: ReturnType<typeof useNavigate>
    }
  | {
      form: FormApi<CategoryFormFieldValues>
      variant: 'edit'
      navigate: ReturnType<typeof useNavigate>
      relatedCategories: StaticDatasetSiblingRow[]
      onDelete: () => void
      isDeleting: boolean
    }

function CategoryFormLayout(props: CategoryFormLayoutProps) {
  const { form, variant, navigate } = props
  const isEdit = variant === 'edit'
  const isDeleting = isEdit ? props.isDeleting : false

  const mainColumn = (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(isSubmitting) => (
        <div className="min-w-0 space-y-4">
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

          <FormActionBar
            className="mt-6"
            left={
              <button
                type="submit"
                disabled={isSubmitting || (isEdit && isDeleting)}
                className={buttonStyles}
              >
                {isSubmitting ? '…' : 'Speichern'}
              </button>
            }
            right={
              isEdit ? (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting || isDeleting}
                    className={buttonStylesSecondary}
                    onClick={() => navigate({ to: '/admin/static-dataset-categories' })}
                  >
                    Abbrechen
                  </button>
                  <AdminTrashIconButton
                    ariaLabel="Statische Datensatz-Kategorie löschen"
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
                  onClick={() => navigate({ to: '/admin/static-dataset-categories' })}
                >
                  Abbrechen
                </button>
              )
            }
          />
        </div>
      )}
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
          <StaticDatasetCategorySiblingsPanel groupKey={groupKey} rows={relatedCategories} />
        )}
      </form.Subscribe>
    </div>
  )
}

type StaticDatasetCategoryFormProps =
  | {
      schema: typeof staticDatasetCategoryCreateFormSchema
      defaultValues: StaticDatasetCategoryCreateFormValues
      onSubmit: (values: StaticDatasetCategoryCreateFormValues) => Promise<FormState | undefined>
      variant: 'create'
    }
  | {
      schema: typeof staticDatasetCategoryEditFormSchema
      defaultValues: StaticDatasetCategoryEditFormValues
      onSubmit: (
        values: StaticDatasetCategoryEditFormValues,
      ) => Promise<StaticDatasetCategoryEditSubmitResult | undefined>
      variant: 'edit'
      categoryKey: string
      relatedCategories: StaticDatasetSiblingRow[]
      onDelete: () => void
      isDeleting: boolean
    }

export function StaticDatasetCategoryForm(
  props: Extract<StaticDatasetCategoryFormProps, { variant: 'create' }>,
)
export function StaticDatasetCategoryForm(
  props: Extract<StaticDatasetCategoryFormProps, { variant: 'edit' }>,
)
export function StaticDatasetCategoryForm(props: StaticDatasetCategoryFormProps) {
  const navigate = useNavigate()

  if (props.variant === 'create') {
    return (
      <Form
        key="create"
        defaultValues={props.defaultValues}
        schema={props.schema}
        showFormErrors
        className="min-w-0 space-y-4"
        onSubmit={async (values) => {
          const result = await props.onSubmit(values)
          return mapFormStateToSubmitResult(result)
        }}
      >
        {(form) => (
          <CategoryFormLayout
            form={form as unknown as FormApi<CategoryFormFieldValues>}
            variant="create"
            navigate={navigate}
          />
        )}
      </Form>
    )
  }

  return (
    <Form
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
            to: '/admin/static-dataset-categories/$categoryKey',
            params: { categoryKey: result.navigateToCategoryKey },
          })
          return {
            success: true,
            message: result.message || 'Gespeichert.',
          } satisfies SubmitResult<CategoryFormFieldValues>
        }
        return mapFormStateToSubmitResult(result)
      }}
    >
      {(form) => (
        <CategoryFormLayout
          form={form as unknown as FormApi<CategoryFormFieldValues>}
          variant="edit"
          navigate={navigate}
          relatedCategories={props.relatedCategories}
          onDelete={props.onDelete}
          isDeleting={props.isDeleting}
        />
      )}
    </Form>
  )
}
