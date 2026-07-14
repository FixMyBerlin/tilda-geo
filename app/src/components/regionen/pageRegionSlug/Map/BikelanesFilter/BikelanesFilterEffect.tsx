import type { ExpressionSpecification } from 'maplibre-gl'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  BIKELANES_FILTER_GREY_COLOR,
  bikelanesFuehrungsformGroups,
  bikelanesOberflaecheGroups,
} from './bikelanesFilterConfig'
import { useActiveBikelanesLayers } from './useActiveBikelanesLayers'
import {
  useBikelanesFuehrungsformDeselected,
  useBikelanesOberflaecheDeselected,
  useBikelanesWidthFilter,
} from './useBikelanesFilterState'

const buildWidthComparisonExpression = (
  operator: 'gt' | 'lt' | 'eq',
  value: number,
): ExpressionSpecification => {
  switch (operator) {
    case 'gt':
      return ['>', ['get', 'width'], value]
    case 'lt':
      return ['<', ['get', 'width'], value]
    case 'eq':
      return ['==', ['get', 'width'], value]
  }
}

/** Combines several "pass" expressions with AND, skipping the ones that are trivially `true`
 * (no filter active for that criterion) — so a single active filter doesn't get wrapped in a
 * needless `['all', expr]`. */
const combinePassExpressions = (
  expressions: (ExpressionSpecification | true)[],
): ExpressionSpecification | true => {
  const real = expressions.filter((expr): expr is ExpressionSpecification => expr !== true)
  if (real.length === 0) return true
  if (real.length === 1) return real[0]!
  return ['all', ...real]
}

/** Prototype: no `map.setFilter` (that would hide features); instead we recolor the existing
 * `line-color` paint of the currently visible bikelanes layers so that features which don't
 * match the Führungsform / Breite filters turn grey, while matching ones keep their style. */
export const BikelanesFilterEffect = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const activeLayers = useActiveBikelanesLayers()
  const fuehrungsformDeselected = useBikelanesFuehrungsformDeselected()
  const oberflaecheDeselected = useBikelanesOberflaecheDeselected()
  const widthFilter = useBikelanesWidthFilter()

  useEffect(
    function applyBikelanesFilterColors() {
      if (!mainMap || !mapLoaded) return
      const map = mainMap.getMap()

      const allFuehrungsformSelected = fuehrungsformDeselected.size === 0
      const selectedCategoryValues = bikelanesFuehrungsformGroups
        .filter((group) => !fuehrungsformDeselected.has(group.id))
        .flatMap((group) => group.categoryValues)

      const fuehrungsformPass: ExpressionSpecification | true = allFuehrungsformSelected
        ? true
        : ['match', ['get', 'category'], selectedCategoryValues, true, false]

      const allOberflaecheSelected = oberflaecheDeselected.size === 0
      const selectedSurfaceValues = bikelanesOberflaecheGroups
        .filter((group) => !oberflaecheDeselected.has(group.id))
        .flatMap((group) => group.surfaceValues)

      const oberflaechePass: ExpressionSpecification | true = allOberflaecheSelected
        ? true
        : ['match', ['get', 'surface'], selectedSurfaceValues, true, false]

      const widthPass: ExpressionSpecification | true = widthFilter
        ? [
            'all',
            ['has', 'width'],
            buildWidthComparisonExpression(widthFilter.operator, widthFilter.value),
          ]
        : true

      const filterIsActive = !allFuehrungsformSelected || !allOberflaecheSelected || !!widthFilter
      const passExpression = combinePassExpressions([fuehrungsformPass, oberflaechePass, widthPass])

      for (const { layerId, originalLineColor } of activeLayers) {
        if (!map.getLayer(layerId)) continue
        try {
          if (!filterIsActive || passExpression === true) {
            map.setPaintProperty(layerId, 'line-color', originalLineColor)
            continue
          }
          map.setPaintProperty(layerId, 'line-color', [
            'case',
            passExpression,
            originalLineColor,
            BIKELANES_FILTER_GREY_COLOR,
          ])
        } catch {
          // Layer might not be fully ready yet (style still loading); next effect run retries.
        }
      }
    },
    [
      mainMap,
      mapLoaded,
      activeLayers,
      fuehrungsformDeselected,
      oberflaecheDeselected,
      widthFilter,
    ],
  )

  return null
}
