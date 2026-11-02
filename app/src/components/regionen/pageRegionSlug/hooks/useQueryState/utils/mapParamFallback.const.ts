/**
 * Typed-search / parse sentinel only — not a real map view. getRegionRedirectUrl replaces this with
 * region.map, getMapParamFromSearch reads it as region.map. MapLibre must never start here: 0/0/0
 * counts as an untouched camera, so the map would jump to the center stored in our map style.
 */
export const mapParamFallback = { zoom: 0, lat: 0, lng: 0 }
