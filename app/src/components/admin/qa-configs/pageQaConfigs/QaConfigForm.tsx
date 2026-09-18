import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { createQaConfigFn, updateQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { CreateQaConfigFormSchema } from '@/server/qa-configs/schemas'
import { QaPercentField } from './QaPercentField'
import { QaThresholdPreview } from './QaThresholdPreview'

export type QaConfigFormValues = {
  slug: string
  label: string
  isActive: 'true' | 'false'
  mapTable: string
  mapAttribution: string
  goodThreshold: string
  needsReviewThreshold: string
  absoluteDifferenceThreshold: string
  regionId: string
  trustedOsmUsernames: string
  referenceFrozenAt: string
}

export const qaConfigFormEmptyDefaults = {
  slug: '',
  label: '',
  isActive: 'true',
  mapTable: '',
  mapAttribution: '',
  goodThreshold: '10',
  needsReviewThreshold: '20',
  absoluteDifferenceThreshold: '4',
  regionId: '',
  trustedOsmUsernames: '',
  referenceFrozenAt: '',
} satisfies QaConfigFormValues

/** Section ids (jump list + URL hash) and titles of the form field groups, in page order. */
const sectionLabels = {
  assignment: 'Zuordnung',
  map: 'Karte',
  thresholds: 'Schwellenwerte',
  trustList: 'Vertrauensliste',
  status: 'Status',
} satisfies Record<string, string>

type Props = {
  regions: Array<{ id: number; slug: string }>
  pageExtras?: AdminFormPageExtras
} & (
  | { mode: 'create'; defaultValues: QaConfigFormValues }
  | { mode: 'edit'; defaultValues: QaConfigFormValues; id: number }
)

export function QaConfigForm(props: Props) {
  const { mode, defaultValues, regions, pageExtras } = props
  const router = useRouter()
  const queryClient = useQueryClient()
  const regionOptions = regions.map((r) => [r.id.toString(), r.slug] as [string, string])

  return (
    <Form<QaConfigFormValues>
      actionBarPlacement="none"
      defaultValues={defaultValues}
      // Field values only — `UpdateQaConfigFormSchema` adds the `id`, which is sent on submit.
      schema={CreateQaConfigFormSchema}
      onSubmit={async (values) => {
        // Send the raw field values: the server functions parse them with the same schema, which
        // converts the percent thresholds to fractions exactly once.
        const result =
          mode === 'create'
            ? await createQaConfigFn({ data: values })
            : await updateQaConfigFn({ data: { ...values, id: props.id } })
        if (!result.success) return result as SubmitResult<QaConfigFormValues>
        // `isActive` feeds the sidebar count.
        await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
        await router.invalidate()
        if (mode === 'create') {
          return { success: true, message: 'Angelegt.', redirect: '/admin/qa-configs' }
        }
        return { success: true }
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel={mode === 'create' ? 'Erstellen' : 'Speichern'}
          cancel={{ to: '/admin/qa-configs' }}
          submitError={submitError}
        >
          <AdminFormSection id="assignment" title={sectionLabels.assignment}>
            <Select
              form={form}
              name="regionId"
              label="Region"
              options={regionOptions}
              help="Region, in der diese QA-Konfiguration angezeigt wird."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="slug"
                label="Slug"
                help="Eindeutiger Bezeichner, z. B. „parking_capacity“."
              />
              <TextField
                form={form}
                name="label"
                label="Name"
                help="Anzeigename, z. B. „Parkplätze Kapazität“."
              />
            </div>
          </AdminFormSection>

          <AdminFormSection id="map" title={sectionLabels.map}>
            <TextField
              form={form}
              name="mapTable"
              label="Kartentabelle"
              help="Name der Datenbanktabelle aus dem Processing, z. B. „public.qa_parkings_euvm“."
            />
            <TextField
              form={form}
              name="mapAttribution"
              label="Quellenangabe"
              optional
              help="Attribution der Kartenquelle, z. B. „QA Data: &copy; OpenStreetMap; tilda-geo.de“."
            />
          </AdminFormSection>

          <AdminFormSection
            id="thresholds"
            title={sectionLabels.thresholds}
            description="Diese Regeln entscheiden automatisch, ob ein Bereich als „Gut“, „Überprüfung nötig“ oder „Problematisch“ markiert wird. Die absolute Toleranz gewinnt immer zuerst — erst wenn ein Bereich sie überschreitet, zählt der Prozentwert."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <QaPercentField
                    form={form}
                    name="goodThreshold"
                    label="Gut bis"
                    help="Weicht der aktuelle Lauf höchstens um diesen Prozentsatz vom Referenzwert ab, gilt der Bereich als „Gut“ (grün)."
                  />
                  <QaPercentField
                    form={form}
                    name="needsReviewThreshold"
                    label="Überprüfung bis"
                    help="Oberhalb von „Gut bis“ und bis zu diesem Prozentsatz gilt „Überprüfung nötig“ (gelb). Alles darüber ist „Problematisch“ (rot)."
                  />
                </div>
                <TextField
                  form={form}
                  name="absoluteDifferenceThreshold"
                  label="Absolute Toleranz (Stellplätze)"
                  type="number"
                  help="So viele Stellplätze Unterschied gelten immer als „Gut“ — unabhängig vom Prozentwert. Verhindert, dass kleine Referenzwerte (z. B. 2 → 3 Stellplätze) fälschlich als große Abweichung zählen."
                />
              </div>
              <QaThresholdPreview form={form} />
            </div>
          </AdminFormSection>

          <AdminFormSection id="trustList" title={sectionLabels.trustList}>
            <TextField
              form={form}
              name="referenceFrozenAt"
              label="Referenz eingefroren am"
              type="date"
              help="Tag, an dem die Referenz (Voronoi-Baseline) eingefroren wurde. OSM-Bearbeitungen ab 00:00 Uhr (UTC) dieses Tages zählen als neu und werden gegen die Liste vertrauenswürdiger OSM-Nutzer:innen geprüft."
            />
            <Textarea
              form={form}
              name="trustedOsmUsernames"
              label="Vertrauensliste (OSM-Benutzernamen)"
              optional
              rows={5}
              help="Ein OSM-Benutzername pro Zeile, wird kleingeschrieben gespeichert. Leere Liste = aus. Eine gelb/rot bewertete Zelle bekommt den System-Status »Gut (Vertrauensliste)«, wenn die seit dem Freeze bearbeiteten Stellplätze zuletzt von diesen Nutzer:innen bearbeitet wurden; bis zu »Absolute Toleranz« Stellplätze anderer Bearbeiter:innen sind erlaubt. Umbenannte OSM-Accounts hier nachtragen."
            />
          </AdminFormSection>

          <AdminFormSection id="status" title={sectionLabels.status}>
            <RadioGroup
              inline
              form={form}
              name="isActive"
              label="Status"
              items={[
                { value: 'true', label: 'Aktiv' },
                { value: 'false', label: 'Inaktiv' },
              ]}
            />
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
