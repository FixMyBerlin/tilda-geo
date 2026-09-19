import { useRouter } from '@tanstack/react-router'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RegionSlugsByContractField } from '@/components/admin/regions/RegionSlugsByContractField'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { updateReviewListForAdminFn } from '@/server/review-lists/review-lists.functions'
import { type ReviewListFormInput, UpdateReviewListFormSchema } from '@/server/review-lists/schemas'

/** Section ids (jump list + URL hash) and titles of the field groups, in page order. */
const sectionLabels = {
  list: 'Prüfliste',
  regions: 'Regionen',
} satisfies Record<string, string>

type Props = {
  listId: number
  initialValues: ReviewListFormInput
  regions: TRegion[]
  pageExtras: AdminFormPageExtras
}

/** Edit-only — lists are created in the region's Prüflisten mode. */
export function ReviewListForm({ listId, initialValues, regions, pageExtras }: Props) {
  const router = useRouter()

  return (
    <Form<ReviewListFormInput>
      actionBarPlacement="none"
      defaultValues={initialValues}
      schema={UpdateReviewListFormSchema}
      onSubmit={async (values) => {
        const result = await updateReviewListForAdminFn({ data: { id: listId, ...values } })
        if (result.success) {
          await router.invalidate()
          return { success: true }
        }
        return result as SubmitResult<ReviewListFormInput>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel="Speichern"
          cancel={{ to: '/admin/review-lists' }}
          submitError={submitError}
        >
          <AdminFormSection id="list" title={sectionLabels.list}>
            <TextField
              form={form}
              name="name"
              label="Name"
              help="Anzeigename der Prüfliste (z.B. 'Problematische Kreuzungen 2026')"
            />
          </AdminFormSection>

          <AdminFormSection
            id="regions"
            title={sectionLabels.regions}
            description="Prüflisten können mehreren Regionen zugeordnet werden. Das ist beispielsweise hilfreich, wenn für einen Auftrag mehrere Regionen mit unterschiedlichen Daten und Nutzer-Gruppen (Freigaben) erstellt werden."
          >
            <RegionSlugsByContractField
              form={form}
              name="regionSlugs"
              regions={regions}
              idPrefix="review-list"
            />
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
