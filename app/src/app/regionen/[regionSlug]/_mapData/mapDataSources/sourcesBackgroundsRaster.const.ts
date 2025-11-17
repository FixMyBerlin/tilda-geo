import { MapDataBackgroundSource } from '@/src/app/regionen/[regionSlug]/_mapData/types'
import {
  sourcesBackgroundsRasterELI,
  SourcesRasterIdsELI,
} from './sourcesBackgroundRasterELI.const'
import {
  sourcesBackgroundsRasterTilda,
  SourcesRasterIdsTILDA,
} from './sourcesBackgroundsRasterTILDA'

export type SourcesRasterIds = SourcesRasterIdsTILDA | SourcesRasterIdsELI

export const sourcesBackgroundsRaster: MapDataBackgroundSource<SourcesRasterIds>[] = [
  ...sourcesBackgroundsRasterTilda,
  ...sourcesBackgroundsRasterELI,
]
