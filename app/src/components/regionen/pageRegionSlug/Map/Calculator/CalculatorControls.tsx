import { useEffect, useRef } from 'react'
import {
  useMapActions,
  useMapBounds,
  useMapLoaded,
  useShowMapLoadingIndicator,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import { CalculatorMapDrawing } from './drawing/CalculatorMapDrawing'
import type { DrawArea } from './drawing/drawAreaTypes'
import { useCalculatorLiveAreas } from './drawing/useCalculatorDraw'
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
  // Includes a drag in progress, so the result follows the pointer.
  const liveAreas = useCalculatorLiveAreas()
  const { updateCalculation } = useUpdateCalculation()
  const mapBounds = useMapBounds()
  const mapLoaded = useMapLoaded()
  const showMapLoadingIndicator = useShowMapLoadingIndicator()
  const { setCalculatorDrawActive } = useMapActions()
  const lastCalculationSignatureRef = useRef<string | null>(null)

  useEffect(
    function flagCalculatorDrawActiveWhileMounted() {
      // While the calculator draw tool is on screen, map clicks belong to drawing and
      // should not open the feature inspector (see RegionMap).
      setCalculatorDrawActive(true)
      return () => setCalculatorDrawActive(false)
    },
    [setCalculatorDrawActive],
  )

  useEffect(
    function updateCalculatorAfterMapStateChange() {
      if (!mapLoaded) return
      if (showMapLoadingIndicator) {
        // The rendered features are about to change (e.g. the calculator layer was just switched
        // on again), so the last result must not block the calculation once the map is idle.
        lastCalculationSignatureRef.current = null
        return
      }

      const calculationSignature = buildCalculationSignature(queryLayers, liveAreas, mapBounds)
      if (lastCalculationSignatureRef.current === calculationSignature) return

      updateCalculation(queryLayers, liveAreas)
      lastCalculationSignatureRef.current = calculationSignature
    },
    [mapLoaded, showMapLoadingIndicator, queryLayers, liveAreas, mapBounds, updateCalculation],
  )

  return (
    <CalculatorMapDrawing
      areas={liveAreas}
      getFeatureLabel={({ index }) => (liveAreas.length > 1 ? `Fläche ${index + 1}` : undefined)}
    />
  )
}
