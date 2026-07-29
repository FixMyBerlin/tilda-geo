import { useRouter } from '@tanstack/react-router'
import {
  adminFormFieldsetClassName,
  adminFormLegendClassName,
} from '@/components/admin/adminFormFieldsetClasses'
import { EN_DECIMAL_HELP } from '@/components/shared/form/enDecimalInput'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import type { RegionMaskConfig } from '@/server/regions/regionConfigMapper.server'
import { generateRegionMaskFn } from '@/server/regions/regions.functions'
import {
  RegionMaskFormRawSchema,
  regionConfigToMaskFormValues,
  type RegionMaskFormInput,
} from '@/server/regions/regionWriteSchema'

const regionMaskFormEmptyDefaults = {
  maskEnabled: 'false' as const,
  maskOsmRelationIds: '',
  maskBufferKm: '10',
} satisfies RegionMaskFormInput

export function regionConfigToMaskFormDefaults(config: RegionMaskConfig) {
  return regionConfigToMaskFormValues(config)
}

type Props = {
  regionSlug: string
  initialValues: RegionMaskFormInput
}

export function RegionMaskForm({ regionSlug, initialValues }: Props) {
  const router = useRouter()
  const defaultValues = { ...regionMaskFormEmptyDefaults, ...initialValues }

  return (
    <Form<RegionMaskFormInput>
      defaultValues={defaultValues}
      schema={RegionMaskFormRawSchema}
      submitLabel="Maske aktualisieren"
      onSubmit={async (values) => {
        const result = await generateRegionMaskFn({
          data: { slug: regionSlug, ...values },
        })
        if (!result.success) return { success: false, message: result.message }
        await router.invalidate()
        const resetValues =
          values.maskEnabled === 'false'
            ? {
                maskEnabled: 'false' as const,
                maskOsmRelationIds: '',
                maskBufferKm: '10',
              }
            : values
        return { success: true, message: result.message, resetValues }
      }}
    >
      {(form) => (
        <fieldset className={adminFormFieldsetClassName}>
          <legend className={adminFormLegendClassName}>Maske</legend>
          <p className="text-sm text-gray-600">
            Masken-Einstellungen werden nicht über <strong>Region speichern</strong> übernommen.
            Änderungen an OSM-IDs oder Buffer zuerst eintragen, dann{' '}
            <strong>Maske aktualisieren</strong> klicken.
          </p>
          <RadioGroup
            inline
            form={form}
            name="maskEnabled"
            label="Maske aktiv"
            items={[
              { value: 'true', label: 'Ja' },
              { value: 'false', label: 'Nein' },
            ]}
          />
          <TextField
            form={form}
            name="maskOsmRelationIds"
            label="OSM Relation IDs"
            help="Komma- oder leerzeichengetrennt"
          />
          <TextField
            decimalEn
            form={form}
            name="maskBufferKm"
            label="Buffer (km)"
            help={EN_DECIMAL_HELP}
          />
          <form.Subscribe selector={(state) => state.values.maskEnabled}>
            {(maskEnabled) =>
              maskEnabled === 'false' ? (
                <p className="text-sm text-gray-500">
                  Deaktiviert die Maske und entfernt den zugehörigen Upload.
                </p>
              ) : null
            }
          </form.Subscribe>
        </fieldset>
      )}
    </Form>
  )
}
