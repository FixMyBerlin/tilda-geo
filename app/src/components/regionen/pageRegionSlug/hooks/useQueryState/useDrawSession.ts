import { useThrottledCallback } from '@tanstack/react-pacer'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { getDrawAreasFromSearch, serializeDrawParam } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useDrawSession = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const drawAreas = getDrawAreasFromSearch(search)

  const commitDrawAreas = (areas: DrawArea[]) => {
    updateSearch({ [searchParamsRegistry.draw]: serializeDrawParam(areas) }, { replace: true })
  }

  const throttledCommitDrawAreas = useThrottledCallback(commitDrawAreas, { wait: 2000 })

  return {
    drawAreas,
    setDrawAreas: (areas: DrawArea[]) => {
      throttledCommitDrawAreas(areas)
    },
  }
}
