import type { RegionStatus } from '@prisma/client'
import { Form } from '@/components/shared/form/Form'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Link } from '@/components/shared/links/Link'
import type { StaticRegion } from '@/data/regions.const'
import { createRegionFn, updateRegionFn } from '@/server/regions/regions.functions'
import { RegionFormSchema } from '@/server/regions/schemas'

type RegionFormValues = {
  slug: string
  promoted: 'true' | 'false'
  status: RegionStatus
}

type Props =
  | {
      mode: 'create'
      creatableRegions: StaticRegion[]
      initialValues: RegionFormValues
    }
  | {
      mode: 'edit'
      initialValues: RegionFormValues
    }

export function RegionForm(props: Props) {
  const { mode, initialValues } = props
  /** Keep `promoted` as `'true'|'false'` strings — matches RadioGroup values and Zod input before `.transform()`. */
  const defaultValues = { ...initialValues }

  const slugRadioItems =
    mode === 'create'
      ? props.creatableRegions.map((r) => ({
          value: r.slug,
          label: `${r.slug} (${r.name})`,
        }))
      : []

  return (
    <Form<typeof RegionFormSchema>
      defaultValues={defaultValues}
      schema={RegionFormSchema}
      onSubmit={async (values) => {
        const fn = mode === 'create' ? createRegionFn : updateRegionFn
        const result = await fn({ data: values })
        if (result.success) return { success: true, redirect: '/admin/regions' }
        return result
      }}
      submitLabel="Region speichern"
    >
      {(form) => (
        <>
          {mode === 'create' && (
            <RadioGroup
              form={form}
              name="slug"
              label="Region (noch nicht in der Datenbank)"
              items={slugRadioItems}
              help={
                <>
                  Nur Einträge aus der statischen Liste, die noch keine DB-Region haben.
                  Voraussetzung:{' '}
                  <Link
                    blank
                    href="https://github.com/FixMyBerlin/tilda-geo/blob/develop/app/src/data/regions.const.ts#L161"
                  >
                    statische Daten deployed
                  </Link>
                  .
                </>
              }
            />
          )}
          <RadioGroup
            form={form}
            name="status"
            label="Status"
            items={[
              { value: 'PUBLIC', label: 'Öffentlich (Jeder kann ansehen)' },
              { value: 'PRIVATE', label: 'Privat (Nur Mitglieder)' },
              { value: 'DEACTIVATED', label: 'Deaktiviert (Nur Admins)' },
            ]}
          />
          <RadioGroup
            form={form}
            name="promoted"
            label="Gelistet"
            items={[
              { value: 'true', label: 'Auf /regions Seite gelistet' },
              { value: 'false', label: 'Nicht gelistet / Nur über Deeplink erreichbar' },
            ]}
          />
        </>
      )}
    </Form>
  )
}
