import { calculatorAreasFromParam, calculatorAreasToParam } from './calculatorModeParam'
import type { DrawArea } from './drawing/drawAreaTypes'
import { useCalculatorModeParam } from './useCalculatorModeParam'

/** The drawn areas of the Summieren mode (`sum.areas`, one GeoJSON geometry) as single polygons. */
export const useCalculatorAreas = () => {
  const { calculatorMode, setCalculatorModeParam } = useCalculatorModeParam()
  const drawAreas = calculatorAreasFromParam(calculatorMode.areas)

  // Not throttled: `drawAreas` is read back from the URL, so a delayed write hands callers a
  // stale value. Callers pass settled edits only (see `useCalculatorDraw`).
  const setDrawAreas = (areas: DrawArea[]) => {
    setCalculatorModeParam({ ...calculatorMode, areas: calculatorAreasToParam(areas) })
  }

  return { drawAreas, setDrawAreas }
}
