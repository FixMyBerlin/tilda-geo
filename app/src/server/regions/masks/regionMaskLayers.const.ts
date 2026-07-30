import type { StaticDatasetLayer } from '@/scripts/StaticDatasets/types'

/** MapLibre layer defs for the regional-mask systemLayer MapDatasetUpload. See maskLayerUtils.ts MASK_INTERACTIVE_LAYER_IDS. */
export const regionMaskLayers = [
  {
    type: 'fill',
    id: 'mask-buffer',
    filter: ['==', ['get', 'mask'], true],
    paint: {
      'fill-color': '#27272a',
      'fill-opacity': 0.8,
      'fill-outline-color': 'transparent',
    },
  },
  {
    type: 'line',
    id: 'mask-boundary-bg',
    filter: ['==', ['get', 'border'], true],
    paint: {
      'line-color': 'hsl(45, 2%, 80%)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 4, 12, 8],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.6, 9, 0.6, 10, 0.3],
      'line-dasharray': [1, 0],
      'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 0, 12, 4],
    },
  },
  {
    type: 'line',
    id: 'mask-boundary',
    filter: ['==', ['get', 'border'], true],
    paint: {
      'line-dasharray': ['step', ['zoom'], ['literal', [2, 0]], 7, ['literal', [2, 2, 6, 2]]],
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.5, 12, 3],
      'line-opacity': 1,
      'line-color': '#dfa762',
    },
  },
] satisfies StaticDatasetLayer[]
