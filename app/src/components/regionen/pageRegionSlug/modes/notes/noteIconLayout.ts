import type { SymbolLayerSpecification } from 'maplibre-gl'

/** Sprite icons for the notes layers: a checkmark for closed notes, a question mark otherwise. */
export const noteIconLayout = (kind: 'osm' | 'intern') =>
  ({
    visibility: 'visible',
    'icon-image': [
      'match',
      ['get', 'status'],
      'closed',
      `note-closed-${kind}`,
      `note-open-${kind}`,
    ],
    'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0.3, 10, 0.5, 22, 0.5],
    'icon-allow-overlap': true,
  }) satisfies SymbolLayerSpecification['layout']
