import type { TRegion } from '@/server/regions/regionConfigMapper.server'

/**
 * Strip a region's sensitive config for the unauthorized (access-denied) view. Keeps only what the
 * denied screen (status) and the page <head> (name/fullName/product) render; blanks categories,
 * mask (OSM relation IDs), contract, nav links, map center, exports, bbox, header logo path, and
 * welcome content — so a slug-guesser can't read a PRIVATE/DEACTIVATED region's configuration
 * through the directly-callable region page RPC.
 *
 * The explicit return type is load-bearing (not just documentation): it contextually types the
 * blanked-out arrays. Inferring instead would widen them to `never[]` and collapse `TRegion` for
 * every consumer downstream.
 */
export function redactRegionForDeniedAccess(region: TRegion): TRegion {
  return {
    ...region,
    mask: null,
    map: { lat: 0, lng: 0, zoom: 0 },
    categories: [],
    backgroundSources: [],
    navigationLinks: [],
    cacheWarming: undefined,
    contract: null,
    exports: null,
    bbox: null,
    logoPath: null,
    welcome: null,
  }
}
