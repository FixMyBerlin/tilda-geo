import { featureCollection } from '@turf/helpers'
import { bboxPolygon, mask } from '@turf/turf'
import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { LayerPosition } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { calculatorAreasFromParam, type CalculatorModeParam } from './calculatorModeParam'
import { useCalculatorModeParam } from './useCalculatorModeParam'

const maskSourceId = 'calculator-areas-mask-source'

// Web Mercator has no poles, so the mask ends before them.
const world = bboxPolygon([-180, -85, 180, 85])

/**
 * Dims the map outside the drawn areas: one polygon that covers the world with the areas cut out.
 * It follows `sum.areas`, so it changes when an edit is finished, not on every frame of a drag.
 * Above everything the map shows, below the drawing, which is mounted on top of the style.
 */
export const CalculatorAreasMask = () => {
  const areasJson = JSON.stringify(useCalculatorModeParam().calculatorMode.areas ?? null)
  const data = useMemo(() => {
    const areas = calculatorAreasFromParam(
      (JSON.parse(areasJson) ?? undefined) as CalculatorModeParam['areas'],
    )
    return featureCollection(areas.length > 0 ? [mask(featureCollection(areas), world)] : [])
  }, [areasJson])

  // Source and Layer side by side, like every map component (see <AllSources> and <AllLayers>).
  return (
    <>
      <Source id={maskSourceId} type="geojson" data={data} />
      <Layer
        id="calculator-areas-mask"
        source={maskSourceId}
        type="fill"
        beforeId={'atlas-app-beforeid-top' satisfies LayerPosition}
        paint={{ 'fill-color': '#ffffff', 'fill-opacity': 0.6 }}
      />
    </>
  )
}
