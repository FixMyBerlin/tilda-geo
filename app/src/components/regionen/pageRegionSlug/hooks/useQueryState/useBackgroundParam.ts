import { parseAsStringLiteral, useQueryState } from 'nuqs'
import {
  sourcesBackgroundsRaster,
  type SourcesRasterIds,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { searchParamsRegistry } from './searchParamsRegistry'

export const defaultBackgroundParam = 'default' satisfies SourcesRasterIds

const validBackgroundParams = [
  defaultBackgroundParam,
  ...sourcesBackgroundsRaster.map((source) => source.id),
] as const

export type BackgroundParam = (typeof validBackgroundParams)[number]

export const useBackgroundParam = () => {
  const [backgroundParam, setBackgroundParam] = useQueryState(
    searchParamsRegistry.bg,
    parseAsStringLiteral(validBackgroundParams).withDefault(defaultBackgroundParam),
  )

  return { backgroundParam, setBackgroundParam }
}
