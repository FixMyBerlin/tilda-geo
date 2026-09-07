import type { SourcesId } from '../../mapDataSources/sources.const'
import type { FileMapDataSubcategoryStyleLayer } from '../../types'
import { mapboxStyleLayers } from './mapboxStyleLayers'

type StructureIconLayersProps = {
  source: SourcesId
  sourceLayer: string
}

/**
 * Always-on bridge/tunnel icons on ways (sprite ids `bridge` / `tunnel`).
 * Overlap is allowed so parallel ways each keep an icon. Non-interactive so
 * clicks hit the underlying line layer.
 */
export const structureIconLayers = ({ source, sourceLayer }: StructureIconLayersProps) =>
  mapboxStyleLayers({
    source,
    sourceLayer,
    interactive: false,
    layers: [
      {
        id: 'structure-icons',
        type: 'symbol',
        filter: [
          'any',
          ['match', ['get', 'bridge'], ['yes'], true, false],
          ['match', ['get', 'tunnel'], ['yes'], true, false],
        ],
        minzoom: 14,
        layout: {
          'icon-image': [
            'case',
            ['match', ['get', 'tunnel'], ['yes'], true, false],
            'tunnel',
            'bridge',
          ],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.7, 18, 1],
          'icon-rotation-alignment': 'viewport',
          'icon-pitch-alignment': 'viewport',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-placement': 'line-center',
        },
        paint: {},
      },
    ],
  }) as FileMapDataSubcategoryStyleLayer[]
