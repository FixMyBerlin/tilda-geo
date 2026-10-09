import {
  createDrawController,
  createDrawHistory,
  useDraw,
  useDrawPreview,
  type DrawFeature,
} from '@osm-editor-kit/react-map-gl-draw'
import { useCalculatorAreas } from '@/components/regionen/pageRegionSlug/modes/calculator/useCalculatorAreas'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { CALCULATOR_AREA_PRECISION, calculatorAreaId } from '../calculatorModeParam'
import type { DrawArea } from './drawAreaTypes'

const calculatorDrawController = createDrawController()
// The steps of the areas only; other drawing surfaces (Prüflisten) keep their own.
const calculatorDrawHistory = createDrawHistory()

const isDrawArea = (feature: DrawFeature): feature is DrawArea =>
  feature.geometry.type === 'Polygon'

/**
 * The calculator's drawing surface. The areas live in the URL (`sum.areas`); a change arrives here
 * once per finished edit, so every edit is one URL update and one step to undo. Change the areas
 * from outside the map with `replace()`, so that is a step as well.
 */
export const useCalculatorDraw = () => {
  const { drawAreas, setDrawAreas } = useCalculatorAreas()
  // In the Summieren mode pointer gestures on the map belong to drawing (see RegionMap).
  const { isCalculator: enabled } = useCurrentMode()

  return useDraw(calculatorDrawController, {
    value: drawAreas,
    onChange: (next) => setDrawAreas(next.filter(isDrawArea)),
    enabled,
    history: calculatorDrawHistory,
    limits: { point: 0, line: 0 },
    // One area is the normal case: the first click starts it, and it stays editable.
    emptyTool: 'polygon',
    selectSingle: true,
    precision: CALCULATOR_AREA_PRECISION,
    // Matches the id the new area gets when it is read back from the URL.
    createId: () => calculatorAreaId(drawAreas.length),
  })
}

/** The areas as drawn right now, including a drag that is not in the URL yet. */
export const useCalculatorLiveAreas = () => {
  const { drawAreas } = useCalculatorAreas()
  return useDrawPreview(calculatorDrawController, drawAreas).filter(isDrawArea)
}
