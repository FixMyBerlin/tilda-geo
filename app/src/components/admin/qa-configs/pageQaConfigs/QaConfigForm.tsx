import type { ReactNode } from 'react'
import type { z } from 'zod'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import type { FormApi } from '@/components/shared/form/types'
import type { FormState } from '@/server/utils/validation'

export const QaConfigFormInputSchema = {
  slug: '',
  label: '',
  isActive: 'true',
  mapTable: '',
  mapAttribution: '',
  goodThreshold: '0.1',
  needsReviewThreshold: '0.2',
  absoluteDifferenceThreshold: '4',
  regionId: '',
} as const

type QaConfigFormBaseValues = {
  slug: string
  label: string
  isActive: string
  mapTable: string
  mapAttribution?: string
  goodThreshold: string
  needsReviewThreshold: string
  absoluteDifferenceThreshold: string
  regionId: string
}

type QaConfigFormProps<TSchema extends z.ZodTypeAny> = {
  actionBarRight?: ReactNode
  schema: TSchema
  defaultValues: z.infer<TSchema> extends { id?: number }
    ? QaConfigFormBaseValues & { id?: number }
    : QaConfigFormBaseValues
  onSubmit: (values: z.infer<TSchema>) => Promise<FormState | undefined>
  submitLabel: string
  regions: Array<{ id: number; slug: string }>
}

export function QaConfigForm<TSchema extends z.ZodTypeAny>({
  actionBarRight,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  regions,
}: QaConfigFormProps<TSchema>) {
  const regionOptions = regions.map((r) => [r.id.toString(), r.slug] as [string, string])

  return (
    <Form
      actionBarRight={actionBarRight}
      defaultValues={defaultValues as z.input<TSchema>}
      schema={schema}
      onSubmit={async (values) => {
        const result = await onSubmit(values as z.infer<TSchema>)
        if (result?.success) return { success: true, redirect: '/admin/qa-configs' }
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
      {(form) => {
        const f = form as unknown as FormApi<QaConfigFormBaseValues>
        return (
          <>
            <Select
              form={f}
              name="regionId"
              label="Region"
              options={regionOptions}
              help="Wähle die Region für diese QA Konfiguration"
            />
            <TextField
              form={f}
              name="slug"
              label="Slug"
              help="Eindeutiger Identifier für diese QA Konfiguration (z.B. 'parking_capacity')"
            />
            <TextField
              form={f}
              name="label"
              label="Label"
              help="Anzeigename für diese QA Konfiguration (z.B. 'Parkplätze Kapazität')"
            />
            <TextField
              form={f}
              name="mapTable"
              label="Map Table"
              help="Name der Datenbanktabelle (z.B. 'public.qa_parkings_euvm')"
            />
            <TextField
              form={f}
              name="mapAttribution"
              label="Map Attribution"
              optional
              help="Attribution für die Kartenquelle (z.B. 'QA Data: &copy; OpenStreetMap; tilda-geo.de')"
            />
            <TextField
              form={f}
              name="goodThreshold"
              label="Good Threshold"
              type="number"
              help="Maximale Abweichung für 'Gut' Status (grün). Bei Abweichung ≤ diesem Wert wird der Status als 'Gut' eingestuft."
            />
            <TextField
              form={f}
              name="needsReviewThreshold"
              label="Needs Review Threshold"
              type="number"
              help="Maximale Abweichung für 'Überprüfung nötig' Status (gelb). Bei Abweichung > Good Threshold aber ≤ diesem Wert wird der Status als 'Überprüfung nötig' eingestuft."
            />
            <TextField
              form={f}
              name="absoluteDifferenceThreshold"
              label="Absolute Difference Threshold"
              type="number"
              help="Maximale absolute Differenz, die nicht als Änderung betrachtet wird."
            />
            <RadioGroup
              form={f}
              name="isActive"
              label="Status"
              items={[
                { value: 'true', label: 'Aktiv' },
                { value: 'false', label: 'Inaktiv' },
              ]}
            />
          </>
        )
      }}
    </Form>
  )
}
