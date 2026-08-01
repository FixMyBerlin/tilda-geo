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
import { SIMPLIFY_MAX_ZOOM, SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import {
  cacheWarmingSourceOptions,
  sourceIdsToWarmingTables,
  warmableSourceIdSet,
  warmableTablesKeySet,
  warmingTablesToSourceIds,
} from '@/server/regions/cacheWarmingSources'
import { parseOsmRelationIds } from '@/server/regions/masks/parseOsmRelationIds'
import {
  formFieldsToGeoJsonBbox,
  geoJsonBboxToFormFields,
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

const cacheWarmingZoomSchema = z.number().int().min(SIMPLIFY_MIN_ZOOM).max(SIMPLIFY_MAX_ZOOM)

/** Write-only; read path keeps lenient `regionCacheWarmingSchema`. */
const regionCacheWarmingWriteSchema = z
  .object({
    minZoom: cacheWarmingZoomSchema,
    maxZoom: cacheWarmingZoomSchema,
    tables: z
      .array(
        z.string().refine((key) => warmableTablesKeySet.has(key), {
          error: (issue) => `Ungültige Cache-Warming-Quelle: ${String(issue.input)}`,
        }),
      )
      .min(1),
  })
  .refine((data) => data.minZoom <= data.maxZoom, {
    message: 'Max Zoom muss größer oder gleich Min Zoom sein',
    path: ['maxZoom'],
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

const RegionWelcomeImageWriteSchema = z.object({
  uploadId: z.number().int().positive(),
  altText: z.string().min(1),
})

export const RegionWelcomeSectionWriteSchema = z.object({
  title: z.string().min(1),
  bodyMarkdown: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative(),
})

const RegionWelcomeWriteSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    bodyMarkdown: z.string().nullable().optional(),
    image: RegionWelcomeImageWriteSchema.nullable(),
    sections: z.array(RegionWelcomeSectionWriteSchema).max(8),
  })
  .superRefine((welcome, ctx) => {
    if (!welcome.enabled) return
    if (!welcome.title.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'Titel ist erforderlich, wenn der Willkommens-Dialog aktiv ist.',
      })
    }
    if (welcome.image != null && !welcome.image.altText.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['image', 'altText'],
        message: 'Bildbeschreibung (Alt-Text) ist erforderlich, wenn ein Bild gesetzt ist.',
      })
    }
  })

export type RegionWelcomeWriteInput = z.infer<typeof RegionWelcomeWriteSchema>

const RegionFormWelcomeSectionSchema = z.object({
  title: z.string(),
  bodyMarkdown: z.string(),
  sortOrder: z.number().int().nonnegative(),
  _key: z.string().optional(),
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
    cacheWarming: regionCacheWarmingWriteSchema.nullable(),
    categories: z.array(catalogIdSchema('Kategorie', categoryIdSet)).min(1),
    backgroundSources: z.array(catalogIdSchema('Hintergrund', backgroundIdSet)),
    exports: z.array(catalogIdSchema('Export', exportIdSet)),
    navigationLinks: z.array(RegionNavigationLinkSchema),
    contractId: z.number().int().positive().nullable(),
    maskOsmRelationIds: z.array(z.number().int().positive()),
    maskBufferKm: z.number().positive(),
    welcome: RegionWelcomeWriteSchema.nullable(),
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

const RegionFormNavigationLinkSchema = z.object({
  name: z.string(),
  linkType: z.enum(['internal', 'external']),
  path: z.string(),
  sortOrder: z.number().int().nonnegative(),
  // Client-only stable identity for the drag-reorder list. Assigned in
  // `regionConfigToFormValues` / `emptyNavLink`; not persisted (transform maps explicit fields only).
  _key: z.string().optional(),
})

type RegionFormNavigationLink = z.infer<typeof RegionFormNavigationLinkSchema>

/** Path/URL format rules for named nav links (empty-name rows are ignored on save). */
export function navigationLinkPathError(link: {
  name: string
  linkType: 'internal' | 'external'
  path: string
}) {
  if (!link.name.trim()) return null
  const path = link.path.trim()
  // Empty path is allowed while typing; write schema rejects it on save.
  if (!path) return null
  if (link.linkType === 'internal' && !path.startsWith('/')) {
    return 'Interner Pfad muss mit „/“ beginnen'
  }
  if (link.linkType === 'external' && !path.startsWith('https://')) {
    return 'Externe URL muss mit https:// beginnen'
  }
  return null
}

const refineNavigationLinksPath = (links: RegionFormNavigationLink[], ctx: z.RefinementCtx) => {
  links.forEach((link, index) => {
    const message = navigationLinkPathError(link)
    if (!message) return
    ctx.addIssue({ code: 'custom', path: [index, 'path'], message })
  })
}

const parseCacheWarmingZoom = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return null
  const zoom = Number(trimmed)
  if (!Number.isInteger(zoom) || zoom < SIMPLIFY_MIN_ZOOM || zoom > SIMPLIFY_MAX_ZOOM) return null
  return zoom
}

const refineCacheWarmingForm = (
  form: {
    cacheWarmingEnabled: boolean
    cacheWarmingMinZoom: string
    cacheWarmingMaxZoom: string
    cacheWarmingSources: string
  },
  ctx: z.RefinementCtx,
) => {
  if (!form.cacheWarmingEnabled) return

  const minZoom = parseCacheWarmingZoom(form.cacheWarmingMinZoom)
  if (!form.cacheWarmingMinZoom.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingMinZoom'],
      message: 'Min Zoom ist erforderlich.',
    })
  } else if (minZoom == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingMinZoom'],
      message: `Min Zoom muss eine Ganzzahl zwischen ${SIMPLIFY_MIN_ZOOM} und ${SIMPLIFY_MAX_ZOOM} sein.`,
    })
  }

  const maxZoom = parseCacheWarmingZoom(form.cacheWarmingMaxZoom)
  if (!form.cacheWarmingMaxZoom.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingMaxZoom'],
      message: 'Max Zoom ist erforderlich.',
    })
  } else if (maxZoom == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingMaxZoom'],
      message: `Max Zoom muss eine Ganzzahl zwischen ${SIMPLIFY_MIN_ZOOM} und ${SIMPLIFY_MAX_ZOOM} sein.`,
    })
  } else if (minZoom != null && maxZoom < minZoom) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingMaxZoom'],
      message: 'Max Zoom muss größer oder gleich Min Zoom sein.',
    })
  }

  const sourceIds = parseCommaList(form.cacheWarmingSources)
  if (sourceIds.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingSources'],
      message: 'Mindestens eine Quelle ist erforderlich.',
    })
    return
  }
  for (const id of sourceIds) {
    if (warmableSourceIdSet.has(id)) continue
    ctx.addIssue({
      code: 'custom',
      path: ['cacheWarmingSources'],
      message: `Ungültige Cache-Warming-Quelle: ${id}`,
    })
  }
}

const refineMaskForm = (
  form: {
    maskEnabled: boolean
    maskOsmRelationIds: string
    maskBufferKm: string
  },
  ctx: z.RefinementCtx,
) => {
  if (!form.maskEnabled) return

  if (!form.maskOsmRelationIds.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['maskOsmRelationIds'],
      message: 'Mindestens eine OSM Relation ID ist erforderlich.',
    })
  } else {
    try {
      parseOsmRelationIds(form.maskOsmRelationIds)
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        path: ['maskOsmRelationIds'],
        message: error instanceof Error ? error.message : 'Ungültige OSM-Relation-IDs',
      })
    }
  }

  if (!form.maskBufferKm.trim() || !isValidEnDecimalInput(form.maskBufferKm.trim())) {
    ctx.addIssue({
      code: 'custom',
      path: ['maskBufferKm'],
      message: EN_DECIMAL_HELP,
    })
  } else if (!(Number(form.maskBufferKm) > 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['maskBufferKm'],
      message: 'Buffer muss größer als 0 sein.',
    })
  }
}

export const RegionFormRawSchema = z
  .object({
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
    cacheWarmingSources: z.string(),
    categories: z.string(),
    backgroundSources: z.string(),
    exports: z.string(),
    navigationLinks: z.array(RegionFormNavigationLinkSchema).superRefine(refineNavigationLinksPath),
    contractId: z.string(),
    maskEnabled: trueOrFalse,
    maskOsmRelationIds: z.string(),
    maskBufferKm: z.string(),
    welcomeEnabled: trueOrFalse,
    welcomeTitle: z.string(),
    welcomeSubtitle: z.string(),
    welcomeBodyMarkdown: z.string(),
    welcomeImageUploadId: z.string(),
    welcomeImageAltText: z.string(),
    welcomeSections: z.array(RegionFormWelcomeSectionSchema),
  })
  .superRefine(refineCacheWarmingForm)
  .superRefine(refineMaskForm)
  .superRefine((form, ctx) => {
    if (!form.welcomeEnabled) return
    if (!form.welcomeTitle.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['welcomeTitle'],
        message: 'Titel ist erforderlich, wenn der Willkommens-Dialog aktiv ist.',
      })
    }
    if (form.welcomeImageUploadId.trim()) {
      if (!form.welcomeImageAltText.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['welcomeImageAltText'],
          message: 'Alt-Text ist erforderlich.',
        })
      }
      const uploadId = Number(form.welcomeImageUploadId)
      if (!Number.isInteger(uploadId) || uploadId <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['welcomeImageUploadId'],
          message: 'Ungültige Upload-ID.',
        })
      }
    }
    if (form.welcomeSections.length > 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['welcomeSections'],
        message: 'Maximal 8 Abschnitte erlaubt.',
      })
    }
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
    ? parseCacheWarmingZoom(form.cacheWarmingMinZoom)
    : null
  const cacheWarmingMaxZoom = cacheWarmingEnabled
    ? parseCacheWarmingZoom(form.cacheWarmingMaxZoom)
    : null
  const cacheWarmingTables = cacheWarmingEnabled
    ? sourceIdsToWarmingTables(parseCommaList(form.cacheWarmingSources))
    : []
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

  const maskEnabled = form.maskEnabled
  const maskOsmRelationIds = maskEnabled ? parseOsmRelationIds(form.maskOsmRelationIds) : []
  // When mask is off, relation IDs are cleared; buffer stays at default 10 km (inert).
  const maskBufferKm = maskEnabled ? Number(form.maskBufferKm) : 10

  const welcomeEnabled = form.welcomeEnabled
  const welcomeImageUploadId = parseOptionalNumber(form.welcomeImageUploadId)
  const welcomeImage =
    welcomeImageUploadId != null
      ? {
          uploadId: welcomeImageUploadId,
          altText: form.welcomeImageAltText.trim(),
        }
      : null
  const welcomeSections = form.welcomeSections
    .filter((section) => section.title.trim())
    .map((section, sortOrder) => ({
      title: section.title.trim(),
      bodyMarkdown: section.bodyMarkdown.trim() || null,
      sortOrder,
    }))
  const welcome = {
    enabled: welcomeEnabled,
    title: form.welcomeTitle.trim(),
    subtitle: form.welcomeSubtitle.trim() || null,
    bodyMarkdown: form.welcomeBodyMarkdown.trim() || null,
    image: welcomeImage,
    sections: welcomeSections,
  }

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
    maskOsmRelationIds,
    maskBufferKm,
    welcome,
  }
}).pipe(RegionWriteSchema)

export const DeleteRegionSchema = z.object({
  slug: z.string(),
})

/** Mask columns → form strings. Shared so loaders can precompute without duplicating join logic. */
function maskConfigToFormFields(config: {
  maskOsmRelationIds: readonly number[]
  maskBufferKm: number
}) {
  const maskOsmRelationIds = [...config.maskOsmRelationIds]
  return {
    maskEnabled: toTrueFalseString(maskOsmRelationIds.length > 0),
    maskOsmRelationIds: joinCommaList(maskOsmRelationIds.map(String)),
    maskBufferKm: String(config.maskBufferKm),
  }
}

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
    cacheWarmingSources: joinCommaList(warmingTablesToSourceIds(config.cacheWarming?.tables ?? [])),
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
    ...maskConfigToFormFields(config),
    welcomeEnabled: toTrueFalseString(config.welcome?.enabled ?? false),
    welcomeTitle: config.welcome?.title ?? '',
    welcomeSubtitle: config.welcome?.subtitle ?? '',
    welcomeBodyMarkdown: config.welcome?.bodyMarkdown ?? '',
    welcomeImageUploadId:
      config.welcome?.image != null ? String(config.welcome.image.uploadId) : '',
    welcomeImageAltText: config.welcome?.image?.altText ?? '',
    welcomeSections: (config.welcome?.sections ?? []).map((section) => ({
      title: section.title,
      bodyMarkdown: section.bodyMarkdown ?? '',
      sortOrder: section.sortOrder,
      _key: newClientListKey(),
    })),
  }
}

export const catalogOptions = {
  categories: categories.map((c) => ({ id: c.id, label: c.id })),
  exports: exportConfigs.map((e) => ({ id: e.id, label: e.title })),
  backgrounds: sourcesBackgroundsRaster.map((s) => ({ id: s.id, label: s.id })),
  cacheWarmingSources: cacheWarmingSourceOptions,
} as const

export type RegionCacheWarming = RegionCacheWarmingConfig & {
  tables: UnionTiles<TableId>[]
}
