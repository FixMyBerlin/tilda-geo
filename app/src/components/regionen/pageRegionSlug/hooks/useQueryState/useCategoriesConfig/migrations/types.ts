import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'

/** Passed into URL migrations so they can rebuild a region's category config from DB assignments. */
export type UrlMigrationContext = {
  categories: MapDataCategoryId[]
}

export type UrlMigration = (url: string, ctx: UrlMigrationContext) => string
