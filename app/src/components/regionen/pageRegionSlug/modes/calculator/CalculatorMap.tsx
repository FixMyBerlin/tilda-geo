import { useEffect, useRef } from 'react'
import {
  useMapBounds,
  useMapLoaded,
  useShowMapLoadingIndicator,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { calculatorAreasToParam } from './calculatorModeParam'
import { CalculatorMapDrawing } from './drawing/CalculatorMapDrawing'
import type { DrawArea } from './drawing/drawAreaTypes'
import { useCalculatorLiveAreas } from './drawing/useCalculatorDraw'
import { SourcesLayersCalculator } from './SourcesLayersCalculator'
import { useCalculatorDatasets } from './useCalculatorDatasets'
import { useCalculatorStyleColors } from './utils/calculatorStyleColors'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

const buildCalculationSignature = (
  queryLayers: string[],
  drawAreas: DrawArea[],
  mapBounds: ReturnType<typeof useMapBounds>,
) =>
  JSON.stringify({
    queryLayers,
    drawAreas,
    mapBounds: mapBounds?.toArray()?.flat(),
  })

/**
 * The map side of the Summieren mode: the points of the selected dataset, the drawing surface
 * and the calculation that follows both. Mounted by `RegionMap` only in this mode; the result is
 * shown in the mode panel (`CalculatorResult`).
 */
export const CalculatorMap = () => {
  const { activeDataset, filter } = useCalculatorDatasets()
  const styleColors = useCalculatorStyleColors()
  // Includes a drag in progress, so the result follows the pointer.
  const liveAreas = useCalculatorLiveAreas()
  const { updateCalculation } = useUpdateCalculation()
  const mapBounds = useMapBounds()
  const mapLoaded = useMapLoaded()
  const showMapLoadingIndicator = useShowMapLoadingIndicator()
  const lastCalculationSignatureRef = useRef<string | null>(null)
  const queryLayers = activeDataset?.queryLayers

  useEffect(
    function updateCalculatorAfterMapStateChange() {
      if (!mapLoaded || !queryLayers) return
      if (showMapLoadingIndicator) {
        // The rendered features are about to change (e.g. another dataset was just selected),
        // so the last result must not block the calculation once the map is idle.
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

  if (!activeDataset) return null

  return (
    <>
      <SourcesLayersCalculator
        dataset={activeDataset}
        filter={filter}
        areas={calculatorAreasToParam(liveAreas)}
        styleColors={styleColors}
      />
      <CalculatorMapDrawing
        areas={liveAreas}
        getFeatureLabel={({ index }) => (liveAreas.length > 1 ? `Fläche ${index + 1}` : undefined)}
      />
    </>
  )
}
