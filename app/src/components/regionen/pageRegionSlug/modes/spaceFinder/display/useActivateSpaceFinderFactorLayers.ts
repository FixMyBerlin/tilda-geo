import { useCategoriesConfig } from '../../../hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import {
  activateSpaceFinderFactorLayers,
  spaceFinderWantedFactorLayers,
} from './spaceFinderFactorLayers'

/**
 * Returns a function that switches on the normal map layers with the input data of the weighted
 * factors. Called once when a run finishes; the layers then stay on like any layer the user
 * switched on.
 */
export const useActivateSpaceFinderFactorLayers = () => {
  const { categoriesConfig, setCategoriesConfig } = useCategoriesConfig()

  return (weights: Record<string, number>) => {
    const result = activateSpaceFinderFactorLayers({
      categoriesConfig,
      wanted: spaceFinderWantedFactorLayers(weights),
    })
    if (result.changed) setCategoriesConfig(result.categoriesConfig, { replace: true })
  }
}
