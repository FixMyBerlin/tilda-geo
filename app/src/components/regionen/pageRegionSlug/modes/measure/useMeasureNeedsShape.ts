import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useMeasureShapes } from './useMeasureShapes'

/** True in the Messen mode while nothing is measured yet: the map is needed, not the panel. */
export const useMeasureNeedsShape = () => {
  const { isMeasure } = useCurrentMode()
  const { shapes } = useMeasureShapes()
  return isMeasure && shapes.length === 0
}
