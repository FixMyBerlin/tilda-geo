import type { MapDataBackgroundSource } from '@/components/regionen/pageRegionSlug/mapData/types'
import type { SourcesRasterIdsELI } from './sourcesBackgroundRasterELI.const'
import { sourcesBackgroundsRasterELI } from './sourcesBackgroundRasterELI.const'
import type { SourcesRasterIdsTILDA } from './sourcesBackgroundsRasterTILDA'
import { sourcesBackgroundsRasterTilda } from './sourcesBackgroundsRasterTILDA'

export type SourcesRasterIds = SourcesRasterIdsTILDA | SourcesRasterIdsELI

export const sourcesBackgroundsRaster: MapDataBackgroundSource<SourcesRasterIds>[] = [
  ...sourcesBackgroundsRasterTilda,
  ...sourcesBackgroundsRasterELI,
]
