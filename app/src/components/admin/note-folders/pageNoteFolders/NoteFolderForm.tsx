import { useRouter } from '@tanstack/react-router'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RegionSlugsByContractField } from '@/components/admin/regions/RegionSlugsByContractField'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { updateNoteFolderForAdminFn } from '@/server/notes/notes.functions'
import { type NoteFolderFormInput, UpdateNoteFolderFormSchema } from '@/server/notes/schemas'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'

/** Section ids (jump list + URL hash) and titles of the field groups, in page order. */
const sectionLabels = {
  folder: 'Ordner',
  regions: 'Regionen',
} satisfies Record<string, string>

type Props = {
  folderId: number
  initialValues: NoteFolderFormInput
  regions: TRegion[]
  pageExtras: AdminFormPageExtras
}

/** Edit-only — folders are created in the region's Hinweise mode. */
export function NoteFolderForm({ folderId, initialValues, regions, pageExtras }: Props) {
  const router = useRouter()

  return (
    <Form<NoteFolderFormInput>
      actionBarPlacement="none"
      defaultValues={initialValues}
      schema={UpdateNoteFolderFormSchema}
      onSubmit={async (values) => {
        const result = await updateNoteFolderForAdminFn({ data: { id: folderId, ...values } })
        if (result.success) {
          await router.invalidate()
          return { success: true }
        }
        return result as SubmitResult<NoteFolderFormInput>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel="Speichern"
          cancel={{ to: '/admin/note-folders' }}
          submitError={submitError}
        >
          <AdminFormSection id="folder" title={sectionLabels.folder}>
            <TextField
              form={form}
              name="name"
              label="Name"
              help="Anzeigename des Ordners (z.B. 'Kreuzungen Innenstadt')"
            />
          </AdminFormSection>

          <AdminFormSection
            id="regions"
            title={sectionLabels.regions}
            description="Hinweis-Ordner können mehreren Regionen zugeordnet werden (z.B. gleiche Kund:in, mehrere Gebietsausschnitte)."
          >
            <RegionSlugsByContractField
              form={form}
              name="regionSlugs"
              regions={regions}
              idPrefix="note-folder"
            />
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
