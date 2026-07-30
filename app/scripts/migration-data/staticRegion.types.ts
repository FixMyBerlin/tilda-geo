import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { SourcesRasterIds } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import type { RegionNotesMode, RegionProduct, RegionStatus } from '@/prisma/generated/browser'
import type { InternalPath } from '@/router'

/** Internal (to) or external (href must be https) nav link. */
type RegionNavigationLink =
  | { name: string; to: InternalPath }
  | { name: string; href: `https://${string}` }

type StaticRegionLogo =
  | { logoPath: string | null; externalLogoPath?: never }
  | { logoPath?: never; externalLogoPath: string | null }

type StaticRegionDownloads =
  | {
      /** Hide the download buttons. */
      exports: null
      bbox: null
    }
  | {
      /** Export IDs available for this region. When set, bbox is required. */
      exports: [ExportId, ...ExportId[]]
      /** Passed to the download API endpoint. */
      bbox: { min: readonly [number, number]; max: readonly [number, number] }
    }

type StaticRegionBase = {
  slug: string
  name: string
  fullName: string
  product: RegionProduct
  /** Relation IDs + buffer (km). `null` skips mask generation. */
  mask: { osmRelationIds: number[]; bufferKm: number } | null
  map: { lat: number; lng: number; zoom: number }
  logoWhiteBackgroundRequired: boolean
  navigationLinks?: RegionNavigationLink[]
  categories: MapDataCategoryId[]
  backgroundSources: SourcesRasterIds[]
  notes: RegionNotesMode
  showSearch?: boolean
  cacheWarming?: { minZoom: number; maxZoom: number; tables: UnionTiles<TableId>[] }
}

export type StaticRegion = StaticRegionBase & StaticRegionLogo & StaticRegionDownloads

export type StaticRegionDbFields = {
  promoted: boolean
  status: RegionStatus
  contractId: number | null
  headerLogoId: number | null
}
