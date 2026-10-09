import bbox from '@turf/bbox'
import booleanIntersects from '@turf/boolean-intersects'
import type { LngLatLike } from 'maplibre-gl'
import { useMap } from 'react-map-gl/maplibre'
import type { StoreCalculator } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { calculatorPartKey } from '../calculatorDatasets.const'
import type { DrawArea } from '../drawing/drawAreaTypes'

/** A layer of the summed points and the part of the dataset it shows. */
export type CalculatorQueryLayer = { id: string; part: string }

export const useUpdateCalculation = () => {
  const { mainMap } = useMap()
  const { updateCalculatorAreasWithFeatures } = useMapActions()

  // We store the Calculator Shapes as URL State `sum.areas`
  // and read from there to do the calculation
  const updateCalculation = (queryLayers: CalculatorQueryLayer[], drawParam: DrawArea[] | null) => {
    // Usually we would check `mapLoaded` here because we cannot trust `mainMap` be ready for all calls
    // However, for some very weird reason this is false when used in here even when true inside the <Map>.
    if (!mainMap) return

    const result: StoreCalculator['calculatorAreasWithFeatures'] = []
    const partByLayerId = new Map(queryLayers.map((layer) => [layer.id, layer.part]))

    drawParam?.forEach((selectArea) => {
      const polygonBbox = bbox(selectArea)
      const southWest: LngLatLike = [polygonBbox[0], polygonBbox[1]]
      const northEast: LngLatLike = [polygonBbox[2], polygonBbox[3]]
      const northEastPointPixel = mainMap.project(northEast)
      const southWestPointPixel = mainMap.project(southWest)

      const features = mainMap.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], {
        layers: queryLayers.map((layer) => layer.id),
      })

      const filteredFeatures = features.filter((feature) => booleanIntersects(feature, selectArea))
      // The part is not a tag of the points; added here it is grouped and filtered like one.
      for (const feature of filteredFeatures) {
        feature.properties[calculatorPartKey] = partByLayerId.get(feature.layer.id)
      }

      result.push({
        key: selectArea.id,
        features: filteredFeatures,
      })
    })

    updateCalculatorAreasWithFeatures(result)
  }

  return { updateCalculation }
}
