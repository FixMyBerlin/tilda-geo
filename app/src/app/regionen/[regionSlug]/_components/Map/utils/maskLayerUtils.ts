/**
 * Mask layer utilities and constants.
 *
 * Mask layers are systemLayer datasets with inspector.enabled: false.
 * These utilities help identify and handle mask layers in the map.
 *
 * @see app/src/app/regionen/[regionSlug]/_components/Map/utils/useInteractiveLayers.ts
 */

/**
 * Mask layer IDs that need to be interactive for click handling.
 * These are hardcoded because mask layers are systemLayer datasets with inspector.enabled: false,
 * so they won't be automatically included in interactive layers via the normal dataset filtering.
 * We need to manually add them to interactiveLayerIds so they show up in handleClick events.
 *
 * Only the fill layer (mask-buffer) is needed for clicking - users click on the filled mask area,
 * not on the boundary lines. The line layers (mask-boundary, mask-boundary-bg) are purely visual
 * and don't need to be interactive.
 */
export const MASK_INTERACTIVE_LAYER_IDS = ['mask-buffer'] as const

export function isMaskLayer(layerId: string): boolean {
  return layerId.startsWith('mask-')
}
