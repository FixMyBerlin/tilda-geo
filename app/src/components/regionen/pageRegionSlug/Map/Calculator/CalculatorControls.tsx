import { useEffect, useRef, useState } from 'react'
import {
  useMapBounds,
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

const buildCalculationSignature = (
  queryLayers: MapDataSourceCalculator['queryLayers'],
  drawAreas: DrawArea[],
  mapBounds: ReturnType<typeof useMapBounds>,
) =>
  JSON.stringify({
    queryLayers,
    drawAreas,
    mapBounds: mapBounds?.toArray()?.flat(),
  })

export const CalculatorControls = ({ queryLayers }: Props) => {
  const { drawAreas, setDrawAreas } = useDrawSession()
  const { updateCalculation } = useUpdateCalculation()
  const mapBounds = useMapBounds()
  const mapLoaded = useMapLoaded()
  const showMapLoadingIndicator = useShowMapLoadingIndicator()
  const lastCalculationSignatureRef = useRef<string | null>(null)
  const [drawMode, setDrawMode] = useState<CalculatorUrlDrawMode>(() =>
    drawAreas.length > 0 ? 'edit' : 'polygon',
  )

  const handleUserGeometry = (next: DrawArea[]) => {
    void setDrawAreas(next)
    updateCalculation(queryLayers, next)
    lastCalculationSignatureRef.current = buildCalculationSignature(queryLayers, next, mapBounds)
  }

  const handleUserDrawModeChange = (mode: CalculatorUrlDrawMode) => {
    setDrawMode(mode)
  }

  useEffect(
    function updateCalculatorAfterMapStateChange() {
      if (!mapLoaded || showMapLoadingIndicator) return

      const calculationSignature = buildCalculationSignature(queryLayers, drawAreas, mapBounds)
      if (lastCalculationSignatureRef.current === calculationSignature) return

      updateCalculation(queryLayers, drawAreas)
      lastCalculationSignatureRef.current = calculationSignature
    },
    [mapLoaded, showMapLoadingIndicator, queryLayers, drawAreas, mapBounds, updateCalculation],
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
