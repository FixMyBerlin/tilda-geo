import {
  sourcesBackgroundsRaster,
  type SourcesRasterIds,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import type { PrivateBackgroundParam } from '@/server/private-backgrounds/privateBackgroundParam'

export const defaultBackgroundParam = 'default' satisfies SourcesRasterIds

export const validBackgroundParams = [
  defaultBackgroundParam,
  ...sourcesBackgroundsRaster.map((source) => source.id),
] as const

/** A catalog id, or the id of a private background source (`PrivateBackgroundSource`). */
export type BackgroundParam = (typeof validBackgroundParams)[number] | PrivateBackgroundParam
