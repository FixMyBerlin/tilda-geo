import {
  createDrawController,
  useDraw,
  useDrawPreview,
  type DrawFeature,
} from '@osm-editor-kit/react-map-gl-draw'
import { useMapCalculatorDrawActive } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useDrawSession } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawSession'
import type { DrawArea } from './drawAreaTypes'

const calculatorDrawController = createDrawController()

const isDrawArea = (feature: DrawFeature): feature is DrawArea =>
  feature.geometry.type === 'Polygon'

/**
 * The calculator's drawing surface. The areas live in the URL (`draw`); a change arrives here
 * once per finished edit, so every edit is one URL update.
 */
export const useCalculatorDraw = () => {
  const { drawAreas, setDrawAreas } = useDrawSession()
  const enabled = useMapCalculatorDrawActive()

  return useDraw(calculatorDrawController, {
    value: drawAreas,
    onChange: (next) => setDrawAreas(next.filter(isDrawArea)),
    enabled,
    limits: { point: 0, line: 0 },
    // One area is the normal case: the first click starts it, and it stays editable.
    emptyTool: 'polygon',
    selectSingle: true,
    // 5 decimals keeps approx <= 2m precision in Berlin and the URL short.
    precision: 5,
  })
}

/** The areas as drawn right now, including a drag that is not in the URL yet. */
export const useCalculatorLiveAreas = () => {
  const { drawAreas } = useDrawSession()
  return useDrawPreview(calculatorDrawController, drawAreas).filter(isDrawArea)
}
