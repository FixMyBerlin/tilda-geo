import { z } from 'zod'
import { categories } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/categories.const'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type { SourcesRasterIds } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { EN_DECIMAL_HELP, isValidEnDecimalInput } from '@/components/shared/form/enDecimalInput'
import { slugSchema } from '@/lib/slugSchema'
import { RegionNotesMode, RegionProduct, RegionStatus } from '@/prisma/generated/browser'
import type { RegionMaskConfig } from '@/server/regions/regionConfigMapper.server'
import {
  formFieldsToGeoJsonBbox,
  geoJsonBboxToFormFields,
  regionCacheWarmingSchema,
  regionGeoJsonBBoxSchema,
  type RegionCacheWarmingConfig,
} from '@/server/regions/regionGeoJson'
import { newClientListKey } from '@/shared/orderedList/clientListKey'
import { joinCommaList, parseCommaList } from '@/shared/orderedList/commaList'

const categoryIdSet = new Set(categories.map((c) => c.id))
const exportIdSet = new Set(exportConfigs.map((e) => e.id))
const backgroundIdSet = new Set(sourcesBackgroundsRaster.map((s) => s.id))

const RegionProductSchema = z.enum(RegionProduct)
const RegionNotesModeSchema = z.enum(RegionNotesMode)
const RegionStatusSchema = z.enum(RegionStatus)

const catalogIdSchema = (label: string, allowed: Set<string>) =>
  z.string().refine((id) => allowed.has(id), {
    error: (issue) => `Ungültige ${label}-ID: ${String(issue.input)}`,
  })

const hasUniqueIds = (ids: string[]) => new Set(ids).size === ids.length

const parseEnDecimalString = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!isValidEnDecimalInput(trimmed)) return Number.NaN
  return Number(trimmed)
}

const enDecimalFormField = z
  .string()
  .trim()
  .min(1)
  .refine((value) => isValidEnDecimalInput(value), {
    message: EN_DECIMAL_HELP,
  })

const RegionNavigationLinkSchema = z
  .object({
    name: z.string().min(1),
    // When set, an internal path must be root-relative — it is rendered via <Link to={…}> and cast
    // to InternalPath, so a value like "impressum" produces a broken/relative header link.
    internalPath: z
      .string()
      .nullable()
      .optional()
      .refine((v) => !v || v.startsWith('/'), { message: 'Interner Pfad muss mit „/“ beginnen' }),
    externalUrl: z.string().nullable().optional(),
    sortOrder: z.number().int().nonnegative(),
  })
  .refine(
    (link) => {
      const hasInternal = Boolean(link.internalPath?.trim())
      const hasExternal = Boolean(link.externalUrl?.trim())
      return hasInternal !== hasExternal
    },
    { message: 'Link braucht entweder internen Pfad oder externe URL' },
  )
  .refine((link) => !link.externalUrl?.trim() || link.externalUrl.startsWith('https://'), {
    message: 'Externe URL muss mit https:// beginnen',
  })

export const RegionWriteSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    fullName: z.string().min(1),
    promoted: z.boolean(),
    status: RegionStatusSchema,
    product: RegionProductSchema,
    notes: RegionNotesModeSchema,
    showSearch: z.boolean(),
    mapLat: z.number(),
    mapLng: z.number(),
    mapZoom: z.number(),
    logoWhiteBackgroundRequired: z.boolean(),
    headerLogoId: z.number().int().positive().nullable(),
    bbox: regionGeoJsonBBoxSchema.nullable(),
    cacheWarming: regionCacheWarmingSchema.nullable(),
    categories: z.array(catalogIdSchema('Kategorie', categoryIdSet)).min(1),
    backgroundSources: z.array(catalogIdSchema('Hintergrund', backgroundIdSet)),
    exports: z.array(catalogIdSchema('Export', exportIdSet)),
    navigationLinks: z.array(RegionNavigationLinkSchema),
    contractId: z.number().int().positive().nullable(),
  })
  .refine(
    (data) => {
      const hasBbox = data.bbox != null
      const hasExports = data.exports.length > 0
      return hasBbox === hasExports
    },
    { message: 'Exports und BBox müssen gemeinsam gesetzt oder leer sein' },
  )
  .refine((data) => hasUniqueIds(data.categories), {
    message: 'Doppelte Kategorie-IDs sind nicht erlaubt',
  })
  .refine((data) => hasUniqueIds(data.backgroundSources), {
    message: 'Doppelte Hintergrund-IDs sind nicht erlaubt',
  })
  .refine((data) => hasUniqueIds(data.exports), {
    message: 'Doppelte Export-IDs sind nicht erlaubt',
  })

export type RegionWriteInput = z.infer<typeof RegionWriteSchema>

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')

const toTrueFalseString = (value: boolean) => (value ? ('true' as const) : ('false' as const))

export const RegionFormRawSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  fullName: z.string().min(1),
  promoted: trueOrFalse,
  status: RegionStatusSchema,
  product: RegionProductSchema,
  notes: RegionNotesModeSchema,
  showSearch: trueOrFalse,
  mapLat: enDecimalFormField,
  mapLng: enDecimalFormField,
  mapZoom: enDecimalFormField,
  headerLogoId: z.string(),
  logoWhiteBackgroundRequired: trueOrFalse,
  downloadsEnabled: trueOrFalse,
  bboxMinLng: z.string(),
  bboxMinLat: z.string(),
  bboxMaxLng: z.string(),
  bboxMaxLat: z.string(),
  cacheWarmingEnabled: trueOrFalse,
  cacheWarmingMinZoom: z.string(),
  cacheWarmingMaxZoom: z.string(),
  cacheWarmingTables: z.string(),
  categories: z.string(),
  backgroundSources: z.string(),
  exports: z.string(),
  navigationLinks: z.array(
    z.object({
      name: z.string(),
      linkType: z.enum(['internal', 'external']),
      path: z.string(),
      sortOrder: z.number().int().nonnegative(),
      // Client-only stable identity for the drag-reorder list. Assigned in
      // `regionConfigToFormValues` / `emptyNavLink`; not persisted (transform maps explicit fields only).
      _key: z.string().optional(),
    }),
  ),
  contractId: z.string(),
})

export type RegionFormInput = z.input<typeof RegionFormRawSchema>

export const RegionFormSchema = RegionFormRawSchema.transform((form): RegionWriteInput => {
  const parseOptionalNumber = (value: string) => parseEnDecimalString(value)

  const downloadsEnabled = form.downloadsEnabled
  const bboxMinLng = downloadsEnabled ? parseOptionalNumber(form.bboxMinLng) : null
  const bboxMinLat = downloadsEnabled ? parseOptionalNumber(form.bboxMinLat) : null
  const bboxMaxLng = downloadsEnabled ? parseOptionalNumber(form.bboxMaxLng) : null
  const bboxMaxLat = downloadsEnabled ? parseOptionalNumber(form.bboxMaxLat) : null
  const bbox = formFieldsToGeoJsonBbox(bboxMinLng, bboxMinLat, bboxMaxLng, bboxMaxLat)

  const cacheWarmingEnabled = form.cacheWarmingEnabled
  const cacheWarmingMinZoom = cacheWarmingEnabled
    ? parseOptionalNumber(form.cacheWarmingMinZoom)
    : null
  const cacheWarmingMaxZoom = cacheWarmingEnabled
    ? parseOptionalNumber(form.cacheWarmingMaxZoom)
    : null
  const cacheWarmingTables = cacheWarmingEnabled ? parseCommaList(form.cacheWarmingTables) : []
  const cacheWarming =
    cacheWarmingEnabled &&
    cacheWarmingMinZoom != null &&
    cacheWarmingMaxZoom != null &&
    cacheWarmingTables.length > 0
      ? {
          minZoom: cacheWarmingMinZoom,
          maxZoom: cacheWarmingMaxZoom,
          tables: cacheWarmingTables,
        }
      : null

  const headerLogoId = parseOptionalNumber(form.headerLogoId)

  return {
    slug: form.slug,
    name: form.name,
    fullName: form.fullName,
    promoted: form.promoted,
    status: form.status,
    product: form.product,
    notes: form.notes,
    showSearch: form.showSearch,
    mapLat: Number(form.mapLat),
    mapLng: Number(form.mapLng),
    mapZoom: Number(form.mapZoom),
    headerLogoId,
    logoWhiteBackgroundRequired: form.logoWhiteBackgroundRequired,
    bbox,
    cacheWarming,
    categories: parseCommaList(form.categories) as MapDataCategoryId[],
    backgroundSources: parseCommaList(form.backgroundSources) as SourcesRasterIds[],
    exports: (downloadsEnabled ? parseCommaList(form.exports) : []) as ExportId[],
    navigationLinks: form.navigationLinks
      .filter((link) => link.name.trim())
      .map((link) => ({
        name: link.name.trim(),
        internalPath: link.linkType === 'internal' ? link.path.trim() || null : null,
        externalUrl: link.linkType === 'external' ? link.path.trim() || null : null,
        sortOrder: link.sortOrder,
      })),
    contractId: parseOptionalNumber(form.contractId),
  }
}).pipe(RegionWriteSchema)

export const DeleteRegionSchema = z.object({
  slug: z.string(),
})

export function regionConfigToFormValues(config: RegionWriteInput) {
  const downloadsEnabled = config.bbox != null
  const bboxFields = geoJsonBboxToFormFields(config.bbox)

  return {
    slug: config.slug,
    name: config.name,
    fullName: config.fullName,
    promoted: toTrueFalseString(config.promoted),
    status: config.status,
    product: config.product,
    notes: config.notes,
    showSearch: toTrueFalseString(config.showSearch),
    mapLat: String(config.mapLat),
    mapLng: String(config.mapLng),
    mapZoom: String(config.mapZoom),
    headerLogoId: config.headerLogoId != null ? String(config.headerLogoId) : '',
    logoWhiteBackgroundRequired: toTrueFalseString(config.logoWhiteBackgroundRequired),
    downloadsEnabled: toTrueFalseString(downloadsEnabled),
    ...bboxFields,
    cacheWarmingEnabled: toTrueFalseString(config.cacheWarming != null),
    cacheWarmingMinZoom: config.cacheWarming != null ? String(config.cacheWarming.minZoom) : '',
    cacheWarmingMaxZoom: config.cacheWarming != null ? String(config.cacheWarming.maxZoom) : '',
    cacheWarmingTables: joinCommaList(config.cacheWarming?.tables ?? []),
    categories: joinCommaList(config.categories),
    backgroundSources: joinCommaList(config.backgroundSources),
    exports: joinCommaList(config.exports),
    navigationLinks: config.navigationLinks.map((link) => ({
      name: link.name,
      linkType: link.internalPath ? ('internal' as const) : ('external' as const),
      path: (link.internalPath ?? link.externalUrl ?? '').toString(),
      sortOrder: link.sortOrder,
      // Client-only drag identity — assigned here so form defaults are complete on first render
      // (avoid a mount-time handleChange that would mark the form dirty).
      _key: newClientListKey(),
    })),
    contractId: config.contractId != null ? String(config.contractId) : '',
  }
}

export function regionConfigToMaskFormValues(config: RegionMaskConfig) {
  return {
    maskEnabled: toTrueFalseString(config.maskOsmRelationIds.length > 0),
    maskOsmRelationIds: joinCommaList(config.maskOsmRelationIds.map(String)),
    maskBufferKm: String(config.maskBufferKm),
  }
}

export const catalogOptions = {
  categories: categories.map((c) => ({ id: c.id, label: c.id })),
  exports: exportConfigs.map((e) => ({ id: e.id, label: e.title })),
  backgrounds: sourcesBackgroundsRaster.map((s) => ({ id: s.id, label: s.id })),
} as const

export type RegionCacheWarming = RegionCacheWarmingConfig & {
  tables: UnionTiles<TableId>[]
}
