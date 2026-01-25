import { FilterSpecification } from 'maplibre-gl'
import { flattenFilterArrays } from '../../../_components/Map/SourcesAndLayers/utils/filterUtils/flattenFilterArrays'
import { wrapFilterWithAll } from '../../../_components/Map/SourcesAndLayers/utils/filterUtils/wrapFilterWithAll'
import { SourcesId } from '../../mapDataSources/sources.const'
import { MapboxStyleLayer } from './types'

export type Props = {
  layers: MapboxStyleLayer[]
  source: SourcesId
  sourceLayer: string
  idPrefix?: string
  interactive?: false
  /**
   * Additional filter to combine with the layer's existing filter.
   * Uses FilterSpecification (includes both ExpressionFilterSpecification and LegacyFilterSpecification)
   * because Mapbox styles may contain legacy filters (e.g., ['has', 'maxspeed']) from Mapbox GL JS v1.10.0,
   * and flattenFilterArrays needs to handle both formats when combining filters.
   * Prefer ExpressionFilterSpecification format for new filters (e.g., ['match', ['get', 'key'], ...]).
   */
  additionalFilter?: FilterSpecification
}

/** @desc Takes the layers we extract from Mapbox with `npm run updateStyles` (which are stripped down to just the style information) and adds the source-information that is only present in our app. It also allows to use the same layers with differend `additionalFilter`.  */
export const mapboxStyleLayers = ({
  layers,
  source,
  sourceLayer,
  idPrefix,
  interactive,
  additionalFilter,
}: Props) => {
  return layers.map((layer) => {
    return {
      ...layer,
      source,
      'source-layer': sourceLayer,
      id: [idPrefix, layer.id].filter(Boolean).join('--'),
      interactive,
      filter: additionalFilter
        ? wrapFilterWithAll(
            flattenFilterArrays(
              layer.filter,
              Array.isArray(additionalFilter) ? additionalFilter : undefined,
            ),
          )
        : layer.filter,
    }
  })
}
