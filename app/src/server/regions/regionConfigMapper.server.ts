import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { SourcesRasterIds } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import type {
  Prisma,
  RegionNotesMode,
  RegionProduct,
  RegionStatus,
} from '@/prisma/generated/client'
import type { InternalPath } from '@/router'
import { prismaJsonField } from '@/server/prismaJsonField.server'
import {
  regionContractRowToClient,
  type TRegionContract,
} from '@/server/region-contracts/regionContractMapper.server'
import {
  parseRegionCacheWarming,
  parseRegionGeoJsonBBox,
  type RegionGeoJsonBBox,
} from '@/server/regions/regionGeoJson'
import { parseRegionWelcomeSections } from '@/server/regions/regionWelcomeSections'
import type { RegionWriteInput, RegionCacheWarming } from '@/server/regions/regionWriteSchema'

export type RegionMaskConfig = {
  maskOsmRelationIds: number[]
  maskBufferKm: number
}

/** Internal (`to`) or external (`href`, https) region nav link. Canonical home after the migration. */
export type RegionNavigationLink =
  | { name: string; to: InternalPath }
  | { name: string; href: `https://${string}` }

export type TRegionWelcomeSection = {
  title: string
  bodyMarkdown?: string | null
  sortOrder: number
}

export type TRegionWelcomeImage = {
  uploadId: number
  path: string
  altText: string
}

export type TRegionWelcome = {
  enabled: true
  title: string
  subtitle?: string | null
  bodyMarkdown?: string | null
  image: TRegionWelcomeImage | null
  sections: TRegionWelcomeSection[]
}

function welcomeWriteInputToScalarData(welcome: RegionWriteInput['welcome']) {
  if (welcome == null) {
    return {
      welcomeEnabled: false,
      welcomeTitle: '',
      welcomeSubtitle: null,
      welcomeBodyMarkdown: null,
      welcomeSections: [] as Prisma.InputJsonValue,
      welcomeImageUploadId: null,
      welcomeImageAltText: null,
    }
  }

  return {
    welcomeEnabled: welcome.enabled,
    welcomeTitle: welcome.title,
    welcomeSubtitle: welcome.subtitle ?? null,
    welcomeBodyMarkdown: welcome.bodyMarkdown ?? null,
    welcomeSections: welcome.sections as Prisma.InputJsonValue,
    welcomeImageUploadId: welcome.image?.uploadId ?? null,
    welcomeImageAltText: welcome.image?.altText ?? null,
  }
}

/**
 * Map validated write input → Prisma Region scalar columns.
 *
 * Strip relation lists (wired separately on create/update), then override nullable JSON
 * with `Prisma.JsonNull` via `prismaJsonField` — plain `null` is rejected by Prisma.
 */
function regionWriteInputToScalarData(config: RegionWriteInput) {
  const {
    categories: _categories,
    backgroundSources: _backgroundSources,
    exports: _exports,
    navigationLinks: _navigationLinks,
    // Mask columns are written only via syncRegionMaskAfterWrite (with geometry upload).
    maskOsmRelationIds: _maskOsmRelationIds,
    maskBufferKm: _maskBufferKm,
    welcome: _welcome,
    ...scalars
  } = config
  return {
    ...scalars,
    ...welcomeWriteInputToScalarData(config.welcome),
    bbox: prismaJsonField(config.bbox),
    cacheWarming: prismaJsonField(config.cacheWarming),
  }
}

/**
 * Prisma `region.create` payload.
 *
 * `RegionWriteInput` is the API/form shape (flat id arrays + nav link objects). Prisma create
 * needs nested `create` for assignment/link tables, plus `prismaJsonField` for nullable JSON —
 * this mapper is that bridge. Update uses `regionWriteInputToUpdateData` (nested deleteMany +
 * create on the same child relations).
 */
export function regionWriteInputToCreateData(config: RegionWriteInput) {
  return {
    ...regionWriteInputToScalarData(config),
    categoryAssignments: {
      create: config.categories.map((categoryId, sortOrder) => ({ categoryId, sortOrder })),
    },
    backgroundAssignments: {
      create: config.backgroundSources.map((sourceId) => ({ sourceId })),
    },
    exportAssignments: {
      create: config.exports.map((exportId) => ({ exportId })),
    },
    navigationLinks: {
      // Write-input link objects already match the nested create columns.
      create: config.navigationLinks,
    },
  }
}

/** Prisma `region.update` payload: scalars (slug omitted — it is the where-key) + full relation replace. */
export function regionWriteInputToUpdateData(config: RegionWriteInput) {
  const { slug: _slug, ...scalars } = regionWriteInputToScalarData(config)
  return {
    ...scalars,
    categoryAssignments: {
      deleteMany: {},
      create: config.categories.map((categoryId, sortOrder) => ({ categoryId, sortOrder })),
    },
    backgroundAssignments: {
      deleteMany: {},
      create: config.backgroundSources.map((sourceId) => ({ sourceId })),
    },
    exportAssignments: {
      deleteMany: {},
      create: config.exports.map((exportId) => ({ exportId })),
    },
    navigationLinks: {
      deleteMany: {},
      create: config.navigationLinks,
    },
  }
}

type RegionWithRelations = Prisma.RegionGetPayload<{ include: typeof regionInclude }>

export type TRegion = {
  id: number
  createdAt: Date
  updatedAt: Date
  slug: string
  promoted: boolean
  status: RegionStatus
  name: string
  fullName: string
  product: RegionProduct
  notes: RegionNotesMode
  showSearch?: boolean
  mask: { osmRelationIds: number[]; bufferKm: number } | null
  map: { lat: number; lng: number; zoom: number }
  logoWhiteBackgroundRequired: boolean
  logoPath: string | null
  navigationLinks?: RegionNavigationLink[]
  categories: MapDataCategoryId[]
  backgroundSources: SourcesRasterIds[]
  cacheWarming?: RegionCacheWarming
  contract: TRegionContract | null
  welcome?: TRegionWelcome | null
} & (
  | {
      exports: null
      bbox: null
    }
  | {
      exports: [ExportId, ...ExportId[]]
      bbox: RegionGeoJsonBBox
    }
)

function regionRowToWelcomeWriteInput(region: RegionWithRelations) {
  const hasWelcomeContent =
    region.welcomeEnabled ||
    region.welcomeTitle.trim() !== '' ||
    region.welcomeSubtitle != null ||
    region.welcomeBodyMarkdown != null ||
    region.welcomeImageUploadId != null ||
    parseRegionWelcomeSections(region.welcomeSections).length > 0

  if (!hasWelcomeContent) return null

  return {
    enabled: region.welcomeEnabled,
    title: region.welcomeTitle,
    subtitle: region.welcomeSubtitle,
    bodyMarkdown: region.welcomeBodyMarkdown,
    image:
      region.welcomeImageUploadId != null && region.welcomeImageAltText
        ? {
            uploadId: region.welcomeImageUploadId,
            altText: region.welcomeImageAltText,
          }
        : null,
    sections: parseRegionWelcomeSections(region.welcomeSections),
  }
}

export function regionRowToWriteInput(region: RegionWithRelations) {
  // Drop DB-only / relation payloads; `regionInclude` already orders assignment/link rows.
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    contract: _contract,
    headerLogo: _headerLogo,
    welcomeImageUpload: _welcomeImageUpload,
    welcomeEnabled: _welcomeEnabled,
    welcomeTitle: _welcomeTitle,
    welcomeSubtitle: _welcomeSubtitle,
    welcomeBodyMarkdown: _welcomeBodyMarkdown,
    welcomeSections: _welcomeSections,
    welcomeImageUploadId: _welcomeImageUploadId,
    welcomeImageAltText: _welcomeImageAltText,
    categoryAssignments,
    backgroundAssignments,
    exportAssignments,
    navigationLinks,
    bbox,
    cacheWarming,
    maskOsmRelationIds,
    maskBufferKm,
    ...scalars
  } = region

  return {
    ...scalars,
    bbox: parseRegionGeoJsonBBox(bbox),
    cacheWarming: parseRegionCacheWarming(cacheWarming),
    maskOsmRelationIds,
    maskBufferKm,
    categories: categoryAssignments.map((a) => a.categoryId as MapDataCategoryId),
    backgroundSources: backgroundAssignments.map((a) => a.sourceId as SourcesRasterIds),
    exports: exportAssignments.map((a) => a.exportId as ExportId),
    navigationLinks: navigationLinks.map((link) => ({
      name: link.name,
      internalPath: link.internalPath,
      externalUrl: link.externalUrl,
      sortOrder: link.sortOrder,
    })),
    welcome: regionRowToWelcomeWriteInput(region),
  }
}

const mapWelcomeRowToClient = (region: RegionWithRelations) => {
  if (!region.welcomeEnabled) return null
  return {
    enabled: true as const,
    title: region.welcomeTitle,
    subtitle: region.welcomeSubtitle,
    bodyMarkdown: region.welcomeBodyMarkdown,
    image:
      region.welcomeImageUploadId != null && region.welcomeImageUpload && region.welcomeImageAltText
        ? {
            uploadId: region.welcomeImageUploadId,
            path: `/api/region-uploads/${region.welcomeImageUpload.id}/${encodeURIComponent(region.welcomeImageUpload.title)}`,
            altText: region.welcomeImageAltText,
          }
        : null,
    sections: parseRegionWelcomeSections(region.welcomeSections),
  } satisfies TRegionWelcome
}

/**
 * DB row → client `TRegion`.
 *
 * Separate from `regionRowToWriteInput`: write input mirrors the form/API schema (flat map fields,
 * internalPath/externalUrl links); mask config is owned by the mask form. The client nests mask/map,
 * builds logoPath, and uses
 * `{ to }` / `{ href }` nav links. Going through write input first only added a pass-through copy.
 */
export function regionRowToClient(region: RegionWithRelations) {
  const {
    mapLat,
    mapLng,
    mapZoom,
    maskOsmRelationIds,
    maskBufferKm,
    headerLogoId: _headerLogoId,
    headerLogo,
    welcomeEnabled: _welcomeEnabled,
    welcomeTitle: _welcomeTitle,
    welcomeSubtitle: _welcomeSubtitle,
    welcomeBodyMarkdown: _welcomeBodyMarkdown,
    welcomeSections: _welcomeSections,
    welcomeImageUploadId: _welcomeImageUploadId,
    welcomeImageAltText: _welcomeImageAltText,
    welcomeImageUpload: _welcomeImageUpload,
    categoryAssignments,
    backgroundAssignments,
    exportAssignments,
    navigationLinks,
    bbox: rawBbox,
    cacheWarming: rawCacheWarming,
    contract,
    contractId: _contractId,
    ...scalars
  } = region

  const bbox = parseRegionGeoJsonBBox(rawBbox)
  const cacheWarming = parseRegionCacheWarming(rawCacheWarming)
  const exports = exportAssignments.map((a) => a.exportId as ExportId)
  const hasDownloads = bbox != null && exports.length > 0

  const base = {
    ...scalars,
    showSearch: scalars.showSearch || undefined,
    mask:
      maskOsmRelationIds.length > 0
        ? { osmRelationIds: maskOsmRelationIds, bufferKm: maskBufferKm }
        : null,
    map: { lat: mapLat, lng: mapLng, zoom: mapZoom },
    navigationLinks: navigationLinks
      .map((link) => {
        if (link.internalPath) {
          return { name: link.name, to: link.internalPath as InternalPath }
        }
        if (link.externalUrl) {
          return { name: link.name, href: link.externalUrl as `https://${string}` }
        }
        return null
      })
      .filter((link): link is RegionNavigationLink => link != null),
    categories: categoryAssignments.map((a) => a.categoryId as MapDataCategoryId),
    backgroundSources: backgroundAssignments.map((a) => a.sourceId as SourcesRasterIds),
    cacheWarming: cacheWarming
      ? {
          ...cacheWarming,
          tables: cacheWarming.tables as UnionTiles<TableId>[],
        }
      : undefined,
    contract: contract ? regionContractRowToClient(contract) : null,
    logoPath: headerLogo
      ? `/api/region-uploads/${headerLogo.id}/${encodeURIComponent(headerLogo.title)}`
      : null,
    welcome: mapWelcomeRowToClient(region),
  }

  if (!hasDownloads) {
    return { ...base, exports: null, bbox: null } satisfies TRegion
  }

  return {
    ...base,
    exports: exports as [ExportId, ...ExportId[]],
    bbox: bbox!,
  } satisfies TRegion
}

/** Single-query load for TRegion; keep `contract` included wherever `region.contract` is shown. */
export const regionInclude = {
  contract: { include: { _count: { select: { regions: true } } } },
  categoryAssignments: { orderBy: { sortOrder: 'asc' as const } },
  backgroundAssignments: { orderBy: { sourceId: 'asc' as const } },
  exportAssignments: { orderBy: { exportId: 'asc' as const } },
  navigationLinks: { orderBy: { sortOrder: 'asc' as const } },
  headerLogo: { select: { id: true, title: true } },
  welcomeImageUpload: { select: { id: true, title: true } },
} as const
