// Custom pin icons that are not part of the generated Mapbox/Maptiler sprite
// (see `scripts/MapboxStyles/mergeSprites.ts`). Registered at runtime via
// `useRegisterCustomMapIcons` and referenced from layer configs by `id`.
export const customMapIcons = {
  busStopPin: { id: 'bus-stop-pin', url: '/map-icons/bus-stop-pin.png' },
  bikeSharePin: { id: 'bike-share-pin', url: '/map-icons/bike-share-pin.png' },
} as const
