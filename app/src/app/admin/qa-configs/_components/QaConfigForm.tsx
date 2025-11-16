'use client'
import { Form, FormProps } from '@/src/app/_components/forms/Form'
import { LabeledRadiobuttonGroup } from '@/src/app/_components/forms/LabeledRadiobuttonGroup'
import { LabeledSelect } from '@/src/app/_components/forms/LabeledSelect'
import { LabeledTextField } from '@/src/app/_components/forms/LabeledTextField'
import getRegions from '@/src/server/regions/queries/getRegions'
import { useQuery } from '@blitzjs/rpc'
import { z } from 'zod'
export { FORM_ERROR } from '@/src/app/_components/forms/Form'

// Define the form input schema (what the form actually receives)
const QaConfigFormInputSchema = z.object({
  slug: z.string(),
  label: z.string(),
  isActive: z.string(),
  mapTable: z.string(),
  mapAttribution: z.string().optional(),
  goodThreshold: z.string(),
  needsReviewThreshold: z.string(),
  absoluteDifferenceThreshold: z.string(),
  regionId: z.string(),
})

export function QaConfigForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [regions] = useQuery(getRegions, {})
  const regionOptions = regions?.map((r) => [r.id.toString(), r.slug] as [string, string]) || []

  return (
    <Form<S> {...props}>
      <LabeledSelect
        name="regionId"
        label="Region"
        options={regionOptions}
        help="Wähle die Region für diese QA Konfiguration"
      />
      <LabeledTextField
        name="slug"
        label="Slug"
        help="Eindeutiger Identifier für diese QA Konfiguration (z.B. 'parking_capacity')"
      />
      <LabeledTextField
        name="label"
        label="Label"
        help="Anzeigename für diese QA Konfiguration (z.B. 'Parkplätze Kapazität')"
      />
      <LabeledTextField
        name="mapTable"
        label="Map Table"
        help="Name der Datenbanktabelle (z.B. 'public.qa_parkings_euvm')"
      />
      <LabeledTextField
        name="mapAttribution"
        label="Map Attribution"
        help="Attribution für die Kartenquelle (z.B. 'QA Data: &copy; OpenStreetMap; tilda-geo.de')"
      />
      <LabeledTextField
        name="goodThreshold"
        label="Good Threshold"
        type="number"
        help="Maximale Abweichung für 'Gut' Status (grün). Bei Abweichung ≤ diesem Wert wird der Status als 'Gut' eingestuft."
        min={0}
        max={1}
        step={0.1}
      />
      <LabeledTextField
        name="needsReviewThreshold"
        label="Needs Review Threshold"
        type="number"
        help="Maximale Abweichung für 'Überprüfung nötig' Status (gelb). Bei Abweichung > Good Threshold aber ≤ diesem Wert wird der Status als 'Überprüfung nötig' eingestuft. Alles darüber wird als 'Problem' (rot) markiert."
        min={0}
        max={1}
        step={0.1}
      />
      <LabeledTextField
        name="absoluteDifferenceThreshold"
        label="Absolute Difference Threshold"
        type="number"
        help="Maximale absolute Differenz, die nicht als Änderung betrachtet wird. Wenn die absolute Differenz ≤ diesem Wert ist, wird keine neue Evaluation erstellt."
        min={0}
        step={1}
      />

      <LabeledRadiobuttonGroup
        scope="isActive"
        items={[
          { value: 'true', label: 'Aktiv' },
          { value: 'false', label: 'Inaktiv' },
        ]}
      />
    </Form>
  )
}
