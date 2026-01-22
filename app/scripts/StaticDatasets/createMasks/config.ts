import { RegionSlug } from '@/src/data/regions.const'

/**
 * Mask layer IDs that need to be interactive for click handling.
 * These are hardcoded because mask layers are systemLayer datasets with inspector.enabled: false,
 * so they won't be automatically included in interactive layers via the normal dataset filtering.
 * We need to manually add them to interactiveLayerIds so they show up in handleClick events.
 *
 * Only the fill layer (mask-buffer) is needed for clicking - users click on the filled mask area,
 * not on the boundary lines. The line layers (mask-boundary, mask-boundary-bg) are purely visual
 * and don't need to be interactive.
 *
 * @see app/src/app/regionen/[regionSlug]/_components/Map/utils/useInteractiveLayers.ts
 */
export const MASK_INTERACTIVE_LAYER_IDS = ['mask-buffer'] as const

export function isMaskLayer(layerId: string) {
  return layerId.startsWith('mask-')
}

export function createMaskConfig(regionSlugs: RegionSlug[]) {
  return {
    regions: regionSlugs,
    public: true,
    systemLayer: true,
    dataSourceType: 'local',
    mapRenderFormat: 'geojson',
    geometricPrecision: 'mask',
    hideDownloadLink: true,
    configs: [
      {
        name: `Maskierung`,
        attributionHtml: 'OpenStreetMap',
        inspector: { enabled: false },
        category: undefined,
        updatedAt: undefined,
        description: undefined,
        dataSourceMarkdown: undefined,
        licence: undefined,
        licenceOsmCompatible: undefined,
        osmIdConfig: undefined,
        legends: undefined,
        layers: [
          // Fill layer - mask overlay
          {
            type: 'fill',
            id: 'mask-buffer', // SEE maskLayerUtils.ts MASK_INTERACTIVE_LAYER_IDS
            paint: {
              'fill-color': '#27272a',
              'fill-opacity': 0.8,
            },
          },
          // Line layer - boundary background with blur
          {
            type: 'line',
            id: 'mask-boundary-bg',
            paint: {
              'line-color': 'hsl(45, 2%, 80%)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 12, 6],
              'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.5, 9, 0.5, 10, 0.1],
              'line-dasharray': [1, 0],
              'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 0, 12, 3],
            },
          },
          // Line layer - boundary style
          {
            type: 'line',
            id: 'mask-boundary',
            paint: {
              'line-dasharray': [
                'step',
                ['zoom'],
                ['literal', [2, 0]],
                7,
                ['literal', [2, 2, 6, 2]],
              ],
              'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.7, 12, 1.5],
              'line-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0, 3, 1, 9, 1, 10, 0.1],
              'line-color': '#dfa762',
            },
          },
        ],
      },
    ],
  }
}
