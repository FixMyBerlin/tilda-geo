import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import type { z } from 'zod'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { RegionContractStatus } from '@/prisma/generated/browser'
import type { RegionContractFormInput } from '@/server/region-contracts/regionContractSchema'
import type { FormState } from '@/server/utils/validation'

export const regionContractFormEmptyDefaults = {
  slug: '',
  name: '',
  status: RegionContractStatus.ACTIVE,
  regionSlugs: [] as string[],
} satisfies RegionContractFormInput

type RegionContractFormRegion = {
  slug: string
  name: string
  contract?: { id: number; name: string } | null
}

type RegionContractFormProps<TSchema extends z.ZodTypeAny> = {
  actionBarRight?: ReactNode
  schema: TSchema
  defaultValues: RegionContractFormInput
  onSubmit: (values: z.infer<TSchema>) => Promise<FormState | undefined>
  submitLabel: string
  regions: RegionContractFormRegion[]
  editingContractId?: number
  slugDisabled?: boolean
}

export function RegionContractForm<TSchema extends z.ZodTypeAny>({
  actionBarRight,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  regions,
  editingContractId,
  slugDisabled = false,
}: RegionContractFormProps<TSchema>) {
  const router = useRouter()
  return (
    <Form<RegionContractFormInput>
      actionBarPlacement="both"
      actionBarRight={actionBarRight}
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={async (values) => {
        const result = await onSubmit(values as z.infer<TSchema>)
        if (result?.success) {
          if (editingContractId !== undefined) {
            await router.invalidate()
            return { success: true }
          }
          return { success: true, redirect: '/admin/region-contracts' }
        }
        if (result && !result.success)
          return {
            success: false,
            message: result.message ?? 'Fehler',
            errors: 'errors' in result ? result.errors : undefined,
          }
        return undefined
      }}
      submitLabel={submitLabel}
    >
      {(form) => (
        <div className="space-y-6">
          <TextField
            form={form}
            name="slug"
            label="Slug"
            disabled={slugDisabled}
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
          <form.Field name="regionSlugs">
            {(field) => {
              const selectedSlugs = field.state.value ?? []
              return (
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-gray-700">Regionen</legend>
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
                </fieldset>
              )
            }}
          </form.Field>
        </div>
      )}
    </Form>
  )
}
