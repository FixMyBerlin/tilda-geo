import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { z } from 'zod'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { createQaConfigFn, updateQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import {
  qaAreaFilterLabels,
  qaDatasets,
  type QaDatasetKey,
} from '@/server/qa-configs/qaDatasets.const'
import {
  CreateQaConfigFormSchema,
  type QaIndicatorDraft,
  type UpdateQaConfigFormSchema,
} from '@/server/qa-configs/schemas'
import { QaIndicatorsField } from './QaIndicatorsField'

export type QaConfigFormValues = {
  slug: string
  label: string
  isActive: 'true' | 'false'
  mapTable: string
  mapAttribution: string
  // '' is the unselected placeholder option; the schema rejects it as "required".
  dataset: QaDatasetKey | ''
  areaTable: string
  areaFilter: 'all' | 'priority' | 'non_priority' | 'with_reference'
  referenceTable: string
  indicators: QaIndicatorDraft[]
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
  dataset: '',
  areaTable: '',
  areaFilter: 'all',
  referenceTable: '',
  indicators: [],
  regionId: '',
  trustedOsmUsernames: '',
  referenceFrozenAt: '',
} satisfies QaConfigFormValues

/** Section ids (jump list + URL hash) and titles of the form field groups, in page order. */
const sectionLabels = {
  assignment: 'Zuordnung',
  map: 'Karte',
  tables: 'Datensatz & Tabellen',
  indicators: 'Indikatoren',
  trustList: 'Vertrauensliste',
  status: 'Status',
} satisfies Record<string, string>

const datasetOptions: [string, string][] = [
  ['', '— Datensatz wählen —'],
  ...Object.entries(qaDatasets).map(([key, dataset]): [string, string] => [key, dataset.label]),
]

const areaFilterItems = Object.entries(qaAreaFilterLabels).map(([value, label]) => ({
  value,
  label,
}))

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
  const regionOptions = regions.map((r): [string, string] => [r.id.toString(), r.slug])
  const configId = mode === 'edit' ? props.id : undefined

  return (
    <Form<QaConfigFormValues>
      actionBarPlacement="none"
      defaultValues={defaultValues}
      // Field values only — `UpdateQaConfigFormSchema` adds the `id`, which is sent on submit.
      schema={CreateQaConfigFormSchema}
      onSubmit={async (values) => {
        // Send the raw field values: the server functions parse them with the same schema, which
        // converts the indicators' percent thresholds to fractions exactly once. `dataset`
        // includes the form's unselected placeholder `''`, which the schema rejects with a normal
        // validation error — the cast just narrows the "form state" type to the schema input.
        const result =
          mode === 'create'
            ? await createQaConfigFn({
                data: values as z.input<typeof CreateQaConfigFormSchema>,
              })
            : await updateQaConfigFn({
                data: { ...values, id: props.id } as z.input<typeof UpdateQaConfigFormSchema>,
              })
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
            id="tables"
            title={sectionLabels.tables}
            description="Legt Maßeinheit und Tabellen fest, aus denen die Indikatoren unten gespeist werden."
          >
            <Select
              form={form}
              name="dataset"
              label="Datensatz"
              options={datasetOptions}
              help="Legt Maßeinheit und die für Indikatoren wählbaren Merkmale fest."
            />
            <TextField
              form={form}
              name="areaTable"
              label="Flächen-Tabelle"
              help='Schema-qualifizierte Tabelle mit den QA-Flächen, z. B. "data.euvm_qa_voronoi_2026".'
            />
            <RadioGroup
              form={form}
              name="areaFilter"
              label="Flächen-Filter"
              items={areaFilterItems}
              help='"Priorisiert" nutzt die Spalte "priority" der Flächen-Tabelle. "Mit Referenzwerten" prüft nur Flächen, die in der Referenz-Tabelle einen Wert haben – Neues in bisher leeren Flächen fällt dann nicht auf.'
            />
            <TextField
              form={form}
              name="referenceTable"
              label="Referenz-Tabelle"
              help='Schema-qualifizierte Tabelle mit den Referenzwerten, z. B. "data.qa_parkings_euvm_reference_2026". Kann nach dem Anlegen noch fehlen (Freeze folgt später).'
            />
          </AdminFormSection>

          <AdminFormSection
            id="indicators"
            title={sectionLabels.indicators}
            description="Jeder Indikator vergleicht je Fläche die Menge (Stellplätze bzw. Meter) mit der Referenz – als Gesamtmenge oder aufgeteilt nach den Werten eines Merkmals, z. B. Meter je Kategorie. Die Differenz ist die Menge, die hinzugekommen, weggefallen oder anders getaggt ist; die Abweichung ist ihr Anteil an der größeren der beiden Mengen. Beispiel: 100 m Radweg, davon 20 m jetzt mit anderer Kategorie → 20 m Differenz, 20 % Abweichung."
          >
            <QaIndicatorsField form={form} configId={configId} />
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
              help="Ein OSM-Benutzername pro Zeile, wird kleingeschrieben gespeichert. Leere Liste = aus. Eine gelb/rot bewertete Zelle bekommt den System-Status »Gut (Vertrauensliste)«, wenn die seit dem Freeze bearbeiteten Werte zuletzt von diesen Nutzer:innen bearbeitet wurden; bis zu »Absolute Toleranz« Einheiten anderer Bearbeiter:innen sind erlaubt. Umbenannte OSM-Accounts hier nachtragen."
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
