import {
  sourcesBackgroundsRaster,
  type SourcesRasterIds,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'

export const defaultBackgroundParam = 'default' satisfies SourcesRasterIds

export const validBackgroundParams = [
  defaultBackgroundParam,
  ...sourcesBackgroundsRaster.map((source) => source.id),
] as const

export type BackgroundParam = (typeof validBackgroundParams)[number]
