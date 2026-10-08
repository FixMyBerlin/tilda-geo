import { useCalculatorAreas } from '@/components/regionen/pageRegionSlug/modes/calculator/useCalculatorAreas'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

/** True in the Summieren mode while no area is drawn yet: the map is needed, not the panel. */
export const useCalculatorNeedsArea = () => {
  const { isCalculator } = useCurrentMode()
  const { drawAreas } = useCalculatorAreas()
  return isCalculator && drawAreas.length === 0
}
