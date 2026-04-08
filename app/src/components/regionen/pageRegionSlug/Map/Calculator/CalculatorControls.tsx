import { useEffect, useState } from 'react'
import {
  useMapLoaded,
  useShowMapLoadingIndicator,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useDrawSession } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawSession'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { CalculatorMapDrawing } from './drawing/CalculatorMapDrawing'
import type { CalculatorUrlDrawMode } from './drawing/calculatorUrlDrawMode'
import type { DrawArea } from './drawing/drawAreaTypes'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

type Props = {
  queryLayers: MapDataSourceCalculator['queryLayers']
}

export const CalculatorControls = ({ queryLayers }: Props) => {
  const { drawAreas, setDrawAreas } = useDrawSession()
  const { updateCalculation } = useUpdateCalculation()
  const mapLoaded = useMapLoaded()
  const showMapLoadingIndicator = useShowMapLoadingIndicator()
  const [drawMode, setDrawMode] = useState<CalculatorUrlDrawMode>(() =>
    drawAreas.length > 0 ? 'edit' : 'polygon',
  )

  const handleUserGeometry = (next: DrawArea[]) => {
    void setDrawAreas(next)
    updateCalculation(queryLayers, next)
  }

  const handleUserDrawModeChange = (mode: CalculatorUrlDrawMode) => {
    setDrawMode(mode)
  }

  useEffect(
    function updateCalculatorAfterMapInitialization() {
      if (!mapLoaded || showMapLoadingIndicator) return
      updateCalculation(queryLayers, drawAreas)
    },
    [mapLoaded, showMapLoadingIndicator, updateCalculation, queryLayers, drawAreas],
  )

  return (
    <CalculatorMapDrawing
      drawAreas={drawAreas}
      drawMode={drawMode}
      getFeatureLabel={({ index }) => (drawAreas.length > 1 ? `Fläche ${index + 1}` : undefined)}
      onUserGeometryChange={handleUserGeometry}
      onUserDrawModeChange={handleUserDrawModeChange}
    />
  )
}
