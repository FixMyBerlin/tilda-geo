import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import type { z } from 'zod'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import type { ReviewListFormInput } from '@/server/review-lists/schemas'
import type { FormState } from '@/server/utils/validation'

type ReviewListFormRegion = {
  slug: string
  name: string
}

type ReviewListFormProps<TSchema extends z.ZodTypeAny> = {
  actionBarRight?: ReactNode
  schema: TSchema
  defaultValues: ReviewListFormInput
  onSubmit: (values: z.infer<TSchema>) => Promise<FormState | undefined>
  submitLabel: string
  regions: ReviewListFormRegion[]
}

export function ReviewListForm<TSchema extends z.ZodTypeAny>({
  actionBarRight,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  regions,
}: ReviewListFormProps<TSchema>) {
  return (
    <Form<ReviewListFormInput>
      actionBarRight={actionBarRight}
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={async (values) => {
        const result = await onSubmit(values as z.infer<TSchema>)
        if (result?.success) return { success: true, redirect: '/admin/review-lists' }
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
            name="name"
            label="Name"
            help="Anzeigename der Prüfliste (z.B. 'Problematische Kreuzungen 2026')"
          />
          <form.Field name="regionSlugs">
            {(field) => {
              const selectedSlugs = field.state.value ?? []
              return (
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-gray-700">Regionen</legend>
                  <p className="mb-2 text-sm text-gray-500">
                    Prüflisten können mehreren Regionen zugeordnet werden (z.B. gleiche Kund:in,
                    mehrere Gebietsausschnitte).
                  </p>
                  <div
                    className={twJoin(
                      'max-h-64 overflow-y-auto rounded border border-gray-200 p-3',
                      choiceOptionListClassName,
                    )}
                  >
                    {regions.map((region) => {
                      const checked = selectedSlugs.includes(region.slug)
                      return (
                        <ChoiceCheckbox
                          key={region.slug}
                          id={`region-${region.slug}`}
                          checked={checked}
                          ariaLabel={`${region.name} (${region.slug})`}
                          label={
                            <>
                              {region.name} ({region.slug})
                            </>
                          }
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
