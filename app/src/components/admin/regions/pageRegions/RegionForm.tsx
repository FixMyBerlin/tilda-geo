import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  adminFormFieldsetClassName,
  adminFormLegendClassName,
} from '@/components/admin/adminFormFieldsetClasses'
import { RegionCategoriesField } from '@/components/admin/regions/pageRegions/RegionCategoriesField'
import { RegionExportsField } from '@/components/admin/regions/pageRegions/RegionExportsField'
import { RegionLogoPicker } from '@/components/admin/regions/pageRegions/RegionLogoPicker'
import { RegionMaskOsmRelationIdsField } from '@/components/admin/regions/pageRegions/RegionMaskOsmRelationIdsField'
import { RegionNavigationLinksEditor } from '@/components/admin/regions/pageRegions/RegionNavigationLinksEditor'
import {
  regionPromotedFormRadioItems,
  regionStatusFormRadioItems,
} from '@/components/regionen/regionMeta/regionFormRadioItems'
import { EN_DECIMAL_HELP } from '@/components/shared/form/enDecimalInput'
import { CheckboxGroup } from '@/components/shared/form/fields/CheckboxGroup'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { regionProductFormItems } from '@/data/tildaProductNames.const'
import {
  RegionContractStatus,
  RegionNotesMode,
  RegionProduct,
  RegionStatus,
} from '@/prisma/generated/browser'
import { regionenIndexQueryKey } from '@/server/regions/regionenIndexQueryOptions'
import { createRegionFn, updateRegionFn } from '@/server/regions/regions.functions'
import {
  catalogOptions,
  RegionFormRawSchema,
  regionConfigToFormValues,
  type RegionFormInput,
} from '@/server/regions/regionWriteSchema'

const notesItems = [
  { value: RegionNotesMode.osmNotes, label: 'OSM Notes' },
  { value: RegionNotesMode.internalNotes, label: 'Internal Notes' },
  { value: RegionNotesMode.disabled, label: 'Deaktiviert' },
] as const

export const regionFormEmptyDefaults = {
  slug: '',
  name: '',
  fullName: '',
  promoted: 'false' as const,
  status: RegionStatus.PUBLIC,
  product: RegionProduct.radverkehr,
  notes: RegionNotesMode.osmNotes,
  showSearch: 'false' as const,
  mapLat: '52.5',
  mapLng: '13.4',
  mapZoom: '10',
  headerLogoId: '',
  logoWhiteBackgroundRequired: 'false' as const,
  downloadsEnabled: 'false' as const,
  bboxMinLng: '',
  bboxMinLat: '',
  bboxMaxLng: '',
  bboxMaxLat: '',
  cacheWarmingEnabled: 'false' as const,
  cacheWarmingMinZoom: '',
  cacheWarmingMaxZoom: '',
  cacheWarmingSources: '',
  categories: '',
  backgroundSources: '',
  exports: '',
  navigationLinks: [] as RegionFormInput['navigationLinks'],
  contractId: '',
  maskEnabled: 'false' as const,
  maskOsmRelationIds: '',
  maskBufferKm: '10',
} satisfies RegionFormInput

type RegionContractOption = { id: number; name: string; status: RegionContractStatus }

type Props = {
  contracts: RegionContractOption[]
  /** Existing region (edit page) enables logo upload to its RegionUpload library. */
  regionId?: number
} & (
  | { mode: 'create'; initialValues: RegionFormInput }
  | { mode: 'edit'; initialValues: RegionFormInput; regionSlug: string }
)

export function RegionForm(props: Props) {
  const { mode, initialValues, contracts, regionId } = props
  const regionSlug = mode === 'edit' ? props.regionSlug : undefined
  const contractOptions: [string, string][] = [
    ['', 'Kein Auftrag'],
    ...contracts.map((c) => {
      const inactive = c.status === RegionContractStatus.INACTIVE ? ' (inaktiv)' : ''
      return [String(c.id), `${c.name}${inactive}`] as [string, string]
    }),
  ]
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const defaultValues = { ...regionFormEmptyDefaults, ...initialValues }

  return (
    <Form<RegionFormInput>
      actionBarPlacement="both"
      defaultValues={defaultValues}
      schema={RegionFormRawSchema}
      onSubmit={async (values) => {
        const result =
          mode === 'create'
            ? await createRegionFn({ data: values })
            : await updateRegionFn({ data: { regionSlug: props.regionSlug, values } })
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: regionenIndexQueryKey })
          await router.invalidate()
          if (mode === 'create') return { success: true, redirect: '/admin/regions' }
          return { success: true }
        }
        return result as SubmitResult<RegionFormInput>
      }}
      submitLabel="Region speichern"
      actionBarRight={
        <button
          type="button"
          className={buttonStylesSecondary}
          onClick={() => navigate({ to: '/admin/regions', search: { contract: undefined } })}
        >
          Abbrechen
        </button>
      }
    >
      {(form) => (
        <div className="space-y-6">
          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Basis</legend>
            {mode === 'create' ? (
              <TextField
                form={form}
                name="slug"
                label="Slug"
                help="Kleinbuchstaben, Ziffern, Bindestriche"
              />
            ) : (
              <TextField form={form} name="slug" label="Slug" disabled />
            )}
            <TextField form={form} name="name" label="Name" />
            <TextField form={form} name="fullName" label="Vollständiger Name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <RadioGroup
                form={form}
                name="status"
                label="Status"
                inline
                items={regionStatusFormRadioItems}
              />
              <RadioGroup
                form={form}
                name="promoted"
                label="Gelistet"
                inline
                items={regionPromotedFormRadioItems}
              />
            </div>
            <RadioGroup
              inline
              form={form}
              name="product"
              label="Produkt"
              items={regionProductFormItems}
            />
            <RadioGroup
              inline
              form={form}
              name="notes"
              label="Notes-Modus"
              items={[...notesItems]}
            />
            <RadioGroup
              inline
              form={form}
              name="showSearch"
              label="Suche anzeigen"
              items={[
                { value: 'true', label: 'Ja' },
                { value: 'false', label: 'Nein' },
              ]}
            />
            <Select
              form={form}
              name="contractId"
              label="Auftrag"
              optional
              options={contractOptions}
            />
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Karte</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                decimalEn
                form={form}
                name="mapLat"
                label="Breitengrad (lat)"
                help={EN_DECIMAL_HELP}
              />
              <TextField
                decimalEn
                form={form}
                name="mapLng"
                label="Längengrad (lng)"
                help={EN_DECIMAL_HELP}
              />
              <TextField decimalEn form={form} name="mapZoom" label="Zoom" help={EN_DECIMAL_HELP} />
            </div>
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Logo</legend>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Logo</span>
              <RegionLogoPicker form={form} regionId={regionId} regionSlug={regionSlug} />
            </div>
            <RadioGroup
              inline
              form={form}
              name="logoWhiteBackgroundRequired"
              label="Weißer Hintergrund nötig"
              items={[
                { value: 'true', label: 'Ja' },
                { value: 'false', label: 'Nein' },
              ]}
            />
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Maske</legend>
            <p className="text-sm text-gray-600">
              Änderungen an den OSM-Relation-IDs oder dem Buffer lösen beim Speichern der Region
              eine Aktualisierung der Maske aus.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <RegionMaskOsmRelationIdsField form={form} />
              <TextField
                decimalEn
                form={form}
                name="maskBufferKm"
                label="Buffer (km)"
                help={EN_DECIMAL_HELP}
              />
            </div>
            <form.Subscribe selector={(state) => state.values.maskEnabled}>
              {(maskEnabled) =>
                maskEnabled === 'false' && initialValues.maskEnabled === 'true' ? (
                  <p className="text-sm text-gray-500">
                    Deaktiviert die Maske und entfernt den zugehörigen Upload.
                  </p>
                ) : null
              }
            </form.Subscribe>
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Downloads</legend>
            <RadioGroup
              inline
              form={form}
              name="downloadsEnabled"
              label="Downloads aktiv"
              items={[
                { value: 'true', label: 'Ja' },
                { value: 'false', label: 'Nein' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <TextField
                decimalEn
                form={form}
                name="bboxMinLng"
                label="BBox min Lng"
                help={EN_DECIMAL_HELP}
              />
              <TextField
                decimalEn
                form={form}
                name="bboxMinLat"
                label="BBox min Lat"
                help={EN_DECIMAL_HELP}
              />
              <TextField
                decimalEn
                form={form}
                name="bboxMaxLng"
                label="BBox max Lng"
                help={EN_DECIMAL_HELP}
              />
              <TextField
                decimalEn
                form={form}
                name="bboxMaxLat"
                label="BBox max Lat"
                help={EN_DECIMAL_HELP}
              />
            </div>
            <RegionExportsField form={form} />
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Katalog-Zuweisungen</legend>
            <RegionCategoriesField form={form} />
            <CheckboxGroup
              form={form}
              name="backgroundSources"
              label="Hintergrund-Quellen"
              options={catalogOptions.backgrounds.map((entry) => ({
                value: entry.id,
                label: entry.label,
              }))}
            />
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Navigation</legend>
            <RegionNavigationLinksEditor form={form} />
          </fieldset>

          <fieldset className={adminFormFieldsetClassName}>
            <legend className={adminFormLegendClassName}>Cache Warming</legend>
            <RadioGroup
              inline
              form={form}
              name="cacheWarmingEnabled"
              label="Cache Warming aktiv"
              items={[
                { value: 'true', label: 'Ja' },
                { value: 'false', label: 'Nein' },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="cacheWarmingMinZoom"
                label="Min Zoom"
                type="number"
                step={1}
                min={4}
                max={14}
                inputMode="numeric"
                help="Ganzzahl von 4 bis 14, z. B. 9"
              />
              <TextField
                form={form}
                name="cacheWarmingMaxZoom"
                label="Max Zoom"
                type="number"
                step={1}
                min={4}
                max={14}
                inputMode="numeric"
                help="Ganzzahl von 4 bis 14, z. B. 9"
              />
            </div>
            <CheckboxGroup
              form={form}
              name="cacheWarmingSources"
              label="Quellen"
              help="Quellen, deren Kacheln beim Cache Warming vorab geladen werden (gleiche Martin-Pfade wie auf der Karte)."
              options={catalogOptions.cacheWarmingSources.map((entry) => ({
                value: entry.id,
                ariaLabel: `${entry.id} (${entry.tablesKey})`,
                label: (
                  <span className="flex flex-col gap-0.5">
                    <span>{entry.id}</span>
                    <span className="font-mono text-xs text-gray-500">{entry.tablesKey}</span>
                  </span>
                ),
              }))}
            />
          </fieldset>
        </div>
      )}
    </Form>
  )
}

export function regionConfigToFormDefaults(
  config: import('@/server/regions/regionWriteSchema').RegionWriteInput,
) {
  return regionConfigToFormValues(config) as RegionFormInput
}
