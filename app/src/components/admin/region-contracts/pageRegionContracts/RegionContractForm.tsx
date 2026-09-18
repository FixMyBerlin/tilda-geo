import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { RegionContractStatus } from '@/prisma/generated/browser'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import {
  createRegionContractFn,
  updateRegionContractFn,
} from '@/server/region-contracts/region-contracts.functions'
import {
  CreateRegionContractFormSchema,
  type RegionContractFormInput,
  UpdateRegionContractFormSchema,
} from '@/server/region-contracts/regionContractSchema'

const regionContractFormEmptyDefaults = {
  slug: '',
  name: '',
  status: RegionContractStatus.ACTIVE,
  regionSlugs: [] as string[],
} satisfies RegionContractFormInput

/** Section ids (jump list + URL hash) and titles of the field groups, in page order. */
const sectionLabels = {
  contract: 'Auftrag',
  regions: 'Regionen',
} satisfies Record<string, string>

type RegionContractFormRegion = {
  slug: string
  name: string
  contract?: { id: number; name: string } | null
}

type Props = {
  regions: RegionContractFormRegion[]
  pageExtras?: AdminFormPageExtras
} & (
  | { mode: 'create' }
  | {
      mode: 'edit'
      initialValues: RegionContractFormInput
      contractId: number
      contractSlug: string
    }
)

export function RegionContractForm(props: Props) {
  const { mode, regions, pageExtras } = props
  const editingContractId = mode === 'edit' ? props.contractId : undefined
  const router = useRouter()
  const queryClient = useQueryClient()
  const defaultValues =
    mode === 'edit'
      ? { ...regionContractFormEmptyDefaults, ...props.initialValues }
      : regionContractFormEmptyDefaults

  return (
    <Form<RegionContractFormInput>
      actionBarPlacement="none"
      defaultValues={defaultValues}
      schema={mode === 'create' ? CreateRegionContractFormSchema : UpdateRegionContractFormSchema}
      onSubmit={async (values) => {
        const result =
          mode === 'create'
            ? await createRegionContractFn({ data: values })
            : await updateRegionContractFn({ data: { ...values, slug: props.contractSlug } })
        if (result.success) {
          await router.invalidate()
          if (mode === 'create') {
            await queryClient.invalidateQueries({
              queryKey: adminNavCountsQueryOptions().queryKey,
            })
            return { success: true, message: 'Angelegt.', redirect: '/admin/region-contracts' }
          }
          return { success: true }
        }
        return result as SubmitResult<RegionContractFormInput>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel={mode === 'create' ? 'Erstellen' : 'Speichern'}
          cancel={{ to: '/admin/region-contracts' }}
          submitError={submitError}
        >
          <AdminFormSection id="contract" title={sectionLabels.contract}>
            <TextField
              form={form}
              name="slug"
              label="Slug"
              disabled={mode === 'edit'}
              help="Kleinbuchstaben, Ziffern, Bindestriche"
            />
            <TextField form={form} name="name" label="Name" />
            <RadioGroup
              form={form}
              name="status"
              label="Status"
              help="Aktiv: Auftrag kann Regionen zugeordnet werden und erscheint in der Auftrags-Auswahl bei Regionen. Inaktiv: keine neuen Zuweisungen; in Auswahllisten ausgeblendet — bereits zugeordnete Regionen behalten den Auftrag, bis du sie änderst oder den Auftrag wieder aktivierst."
              items={[
                { value: RegionContractStatus.ACTIVE, label: 'Aktiv' },
                { value: RegionContractStatus.INACTIVE, label: 'Inaktiv' },
              ]}
            />
          </AdminFormSection>

          <AdminFormSection id="regions" title={sectionLabels.regions}>
            <form.Field name="regionSlugs">
              {(field) => {
                const selectedSlugs = field.state.value ?? []
                return (
                  <div
                    className={twJoin(
                      'max-h-64 overflow-y-auto rounded border border-gray-200 p-3',
                      choiceOptionListClassName,
                    )}
                  >
                    {regions.map((region) => {
                      const checked = selectedSlugs.includes(region.slug)
                      const otherContract =
                        region.contract != null && region.contract.id !== editingContractId
                          ? region.contract.name
                          : null
                      const label = (
                        <>
                          {region.name} ({region.slug})
                          {otherContract ? ` — Auftrag: ${otherContract}` : ''}
                        </>
                      )
                      return (
                        <ChoiceCheckbox
                          key={region.slug}
                          id={`region-${region.slug}`}
                          checked={checked}
                          ariaLabel={`${region.name} (${region.slug})`}
                          label={label}
                          onBlur={field.handleBlur}
                          onChange={(nextChecked) => {
                            const next = nextChecked
                              ? [...selectedSlugs, region.slug]
                              : selectedSlugs.filter((slug) => slug !== region.slug)
                            field.handleChange(next)
                          }}
                        />
                      )
                    })}
                  </div>
                )
              }}
            </form.Field>
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
