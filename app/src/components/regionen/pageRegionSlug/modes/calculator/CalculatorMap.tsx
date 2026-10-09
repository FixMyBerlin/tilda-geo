import { useDebouncedValue } from '@tanstack/react-pacer'
import { useEffect, useMemo, useRef } from 'react'
import {
  useMapBounds,
  useMapLoaded,
  useShowMapLoadingIndicator,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { calculatorAreasToParam, type CalculatorModeParam } from './calculatorModeParam'
import { CalculatorMapDrawing } from './drawing/CalculatorMapDrawing'
import type { DrawArea } from './drawing/drawAreaTypes'
import { useCalculatorLiveAreas } from './drawing/useCalculatorDraw'
import { SourcesLayersCalculator } from './SourcesLayersCalculator'
import { useCalculatorAreas } from './useCalculatorAreas'
import { useCalculatorDatasets } from './useCalculatorDatasets'
import { useCalculatorStyleColors } from './utils/calculatorStyleColors'
import { type CalculatorQueryLayer, useUpdateCalculation } from './utils/useUpdateCalculation'

const POINTS_FOLLOW_AREAS_MS = 300

/**
 * The areas for the dimming of the points, once the areas of the URL have been still for a
 * moment. A new `within` expression makes MapLibre rebuild every tile of the dataset in its
 * workers, and the next change of the drawn area waits behind that work. Several undo or redo
 * steps in a row would each start a rebuild and each show up late; this way only the last does.
 */
const usePointAreas = (drawAreas: DrawArea[]) => {
  const areasJson = JSON.stringify(calculatorAreasToParam(drawAreas) ?? null)
  const [settledJson] = useDebouncedValue(areasJson, { wait: POINTS_FOLLOW_AREAS_MS })
  return useMemo(
    () => (JSON.parse(settledJson) ?? undefined) as CalculatorModeParam['areas'],
    [settledJson],
  )
}

const buildCalculationSignature = (
  queryLayers: CalculatorQueryLayer[],
  drawAreas: DrawArea[],
  mapBounds: ReturnType<typeof useMapBounds>,
) =>
  JSON.stringify({
    queryLayers,
    drawAreas,
    mapBounds: mapBounds?.toArray()?.flat(),
  })

/**
 * The map side of the Summieren mode: the points of the selected dataset (all its parts), the drawing surface
 * and the calculation that follows both. Mounted by `RegionMap` only in this mode; the result is
 * shown in the mode panel (`CalculatorResult`).
 */
export const CalculatorMap = () => {
  const { activeDataset, filter } = useCalculatorDatasets()
  const styleColors = useCalculatorStyleColors()
  // The areas of the URL change once per finished edit. The calculation and the dimming of the
  // points follow them, not the pointer: both are too heavy to run on every frame of a drag.
  const { drawAreas } = useCalculatorAreas()
  // Includes a drag in progress; only the labels follow it.
  const liveAreas = useCalculatorLiveAreas()
  const pointAreas = usePointAreas(drawAreas)
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

      const calculationSignature = buildCalculationSignature(queryLayers, drawAreas, mapBounds)
      if (lastCalculationSignatureRef.current === calculationSignature) return

      updateCalculation(queryLayers, drawAreas)
      lastCalculationSignatureRef.current = calculationSignature
    },
    [mapLoaded, showMapLoadingIndicator, queryLayers, drawAreas, mapBounds, updateCalculation],
  )

  if (!activeDataset) return null

  return (
    <>
      {activeDataset.parts.map((part) => (
        <SourcesLayersCalculator
          key={part.id}
          datasetId={activeDataset.id}
          part={part}
          filter={filter}
          areas={pointAreas}
          styleColors={styleColors}
        />
      ))}
      <CalculatorMapDrawing
        areas={liveAreas}
        getFeatureLabel={({ index }) => (liveAreas.length > 1 ? `Fläche ${index + 1}` : undefined)}
      />
    </>
  )
}
