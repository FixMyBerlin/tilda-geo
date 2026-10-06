import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RegionCategoriesField } from '@/components/admin/regions/pageRegions/RegionCategoriesField'
import { RegionExportsField } from '@/components/admin/regions/pageRegions/RegionExportsField'
import { RegionLogoPicker } from '@/components/admin/regions/pageRegions/RegionLogoPicker'
import { RegionMaskOsmRelationIdsField } from '@/components/admin/regions/pageRegions/RegionMaskOsmRelationIdsField'
import { RegionNavigationLinksEditor } from '@/components/admin/regions/pageRegions/RegionNavigationLinksEditor'
import { RegionWelcomeEditor } from '@/components/admin/regions/pageRegions/RegionWelcomeEditor'
import {
  regionPromotedFormRadioItems,
  regionStatusFormRadioItems,
} from '@/components/regionen/regionMeta/regionFormRadioItems'
import { EN_DECIMAL_HELP } from '@/components/shared/form/enDecimalInput'
import { CheckboxGroup } from '@/components/shared/form/fields/CheckboxGroup'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { Link } from '@/components/shared/links/Link'
import { regionProductFormItems } from '@/data/tildaProductNames.const'
import { RegionContractStatus, RegionProduct, RegionStatus } from '@/prisma/generated/browser'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { regionenIndexQueryKey } from '@/server/regions/regionenIndexQueryOptions'
import { createRegionFn, updateRegionFn } from '@/server/regions/regions.functions'
import {
  catalogOptions,
  RegionFormRawSchema,
  regionConfigToFormValues,
  type RegionFormInput,
} from '@/server/regions/regionWriteSchema'

const yesNoItems = [
  { value: 'true', label: 'Ja' },
  { value: 'false', label: 'Nein' },
]

/** Section ids (jump list + URL hash) and titles of the 12 field groups, in page order. */
const sectionLabels = {
  identity: 'Identität',
  visibility: 'Sichtbarkeit',
  contract: 'Auftrag',
  map: 'Karte',
  logo: 'Logo',
  mask: 'Maske',
  downloads: 'Downloads',
  categories: 'Kategorien',
  navigation: 'Navigation',
  welcome: 'Willkommensdialog',
  cache: 'Cache-Warming',
  notes: 'Hinweise',
} satisfies Record<string, string>

export const regionFormEmptyDefaults = {
  slug: '',
  name: '',
  fullName: '',
  promoted: 'false' as const,
  status: RegionStatus.PUBLIC,
  product: RegionProduct.radverkehr,
  notesOsm: 'true' as const,
  notesInternal: 'false' as const,
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
  welcomeEnabled: 'false' as const,
  welcomeTitle: '',
  welcomeSubtitle: '',
  welcomeBodyMarkdown: '',
  welcomeImageUploadId: '',
  welcomeImageAltText: '',
  welcomeSections: [] as RegionFormInput['welcomeSections'],
} satisfies RegionFormInput

type RegionContractOption = {
  id: number
  slug: string
  name: string
  status: RegionContractStatus
}

type Props = {
  contracts: RegionContractOption[]
  /** Existing region (edit page) enables logo upload to its RegionUpload library. */
  regionId?: number
  pageExtras?: AdminFormPageExtras
} & (
  | { mode: 'create'; initialValues: RegionFormInput }
  | { mode: 'edit'; initialValues: RegionFormInput; regionSlug: string }
)

export function RegionForm(props: Props) {
  const { mode, initialValues, contracts, regionId, pageExtras } = props
  const regionSlug = mode === 'edit' ? props.regionSlug : undefined
  const contractOptions: [string, string][] = [
    ['', 'Kein Auftrag'],
    ...contracts.map((c) => {
      const inactive = c.status === RegionContractStatus.INACTIVE ? ' (inaktiv)' : ''
      return [String(c.id), `${c.name}${inactive}`] as [string, string]
    }),
  ]
  const router = useRouter()
  const queryClient = useQueryClient()
  const defaultValues = { ...regionFormEmptyDefaults, ...initialValues }

  return (
    <Form<RegionFormInput>
      actionBarPlacement="none"
      defaultValues={defaultValues}
      schema={RegionFormRawSchema}
      onSubmit={async (values) => {
        const result =
          mode === 'create'
            ? await createRegionFn({ data: values })
            : await updateRegionFn({ data: { regionSlug: props.regionSlug, values } })
        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: regionenIndexQueryKey })
          if (mode === 'create') {
            await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
          }
          await router.invalidate()
          if (mode === 'create') {
            return { success: true, message: 'Angelegt.', redirect: '/admin/regions' }
          }
          return { success: true }
        }
        return result as SubmitResult<RegionFormInput>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel={mode === 'create' ? 'Erstellen' : 'Speichern'}
          cancel={{ to: '/admin/regions' }}
          submitError={submitError}
        >
          <AdminFormSection id="identity" title={sectionLabels.identity}>
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
            <RadioGroup
              inline
              form={form}
              name="product"
              label="Produkt"
              items={regionProductFormItems}
            />
          </AdminFormSection>

          <AdminFormSection id="visibility" title={sectionLabels.visibility}>
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
              name="showSearch"
              label="Suche anzeigen"
              items={yesNoItems}
            />
          </AdminFormSection>

          <AdminFormSection id="contract" title={sectionLabels.contract}>
            <Select
              form={form}
              name="contractId"
              label="Auftrag"
              optional
              options={contractOptions}
            />
            {mode === 'edit' ? (
              <form.Subscribe selector={(state) => state.values.contractId}>
                {(contractId) => {
                  const contract = contracts.find((c) => String(c.id) === contractId)
                  return contract ? (
                    <p className="text-sm">
                      <Link
                        to="/admin/region-contracts/$slug/edit"
                        params={{ slug: contract.slug }}
                      >
                        Auftrag „{contract.name}“ bearbeiten
                      </Link>
                    </p>
                  ) : null
                }}
              </form.Subscribe>
            ) : null}
          </AdminFormSection>

          <AdminFormSection id="map" title={sectionLabels.map}>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                decimalEn
                form={form}
                name="mapLat"
                label="Breitengrad"
                help={EN_DECIMAL_HELP}
              />
              <TextField
                decimalEn
                form={form}
                name="mapLng"
                label="Längengrad"
                help={EN_DECIMAL_HELP}
              />
              <TextField decimalEn form={form} name="mapZoom" label="Zoom" help={EN_DECIMAL_HELP} />
            </div>
          </AdminFormSection>

          <AdminFormSection id="logo" title={sectionLabels.logo}>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Logo</span>
              <RegionLogoPicker form={form} regionId={regionId} regionSlug={regionSlug} />
            </div>
            <RadioGroup
              inline
              form={form}
              name="logoWhiteBackgroundRequired"
              label="Weißer Hintergrund nötig"
              items={yesNoItems}
            />
          </AdminFormSection>

          <AdminFormSection
            id="mask"
            title={sectionLabels.mask}
            description="Änderungen an den OSM-Relation-IDs oder dem Buffer lösen beim Speichern der Region eine Aktualisierung der Maske aus."
          >
            <RadioGroup
              inline
              form={form}
              name="maskEnabled"
              label="Maske aktiv"
              items={yesNoItems}
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
          </AdminFormSection>

          <AdminFormSection id="downloads" title={sectionLabels.downloads}>
            <RadioGroup
              inline
              form={form}
              name="downloadsEnabled"
              label="Downloads aktiv"
              items={yesNoItems}
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
          </AdminFormSection>

          <AdminFormSection id="categories" title={sectionLabels.categories}>
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
          </AdminFormSection>

          <AdminFormSection id="navigation" title={sectionLabels.navigation}>
            <RegionNavigationLinksEditor form={form} />
          </AdminFormSection>

          <AdminFormSection id="welcome" title={sectionLabels.welcome}>
            <RegionWelcomeEditor form={form} regionId={regionId} regionSlug={regionSlug} />
          </AdminFormSection>

          <AdminFormSection id="cache" title={sectionLabels.cache}>
            <RadioGroup
              inline
              form={form}
              name="cacheWarmingEnabled"
              label="Cache-Warming aktiv"
              items={yesNoItems}
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
              help="Quellen, deren Kacheln beim Cache-Warming vorab geladen werden (gleiche Martin-Pfade wie auf der Karte)."
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
          </AdminFormSection>

          <AdminFormSection id="notes" title={sectionLabels.notes}>
            <div className={choiceOptionListClassName}>
              {(
                [
                  ['notesOsm', 'OSM-Hinweise anzeigen'],
                  ['notesInternal', 'Interne TILDA Hinweise anzeigen'],
                ] as const
              ).map(([name, label]) => (
                <form.Field key={name} name={name}>
                  {(field) => (
                    <ChoiceCheckbox
                      id={name}
                      name={field.name}
                      checked={field.state.value === 'true'}
                      ariaLabel={label}
                      label={label}
                      onBlur={field.handleBlur}
                      onChange={(checked) =>
                        field.handleChange((_prev) => (checked ? 'true' : 'false') as typeof _prev)
                      }
                    />
                  )}
                </form.Field>
              ))}
            </div>
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}

export function regionConfigToFormDefaults(
  config: import('@/server/regions/regionWriteSchema').RegionWriteInput,
) {
  return regionConfigToFormValues(config) as RegionFormInput
}
