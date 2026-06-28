// Osmium expression syntax: https://docs.osmcode.org/osmium/latest/osmium-tags-filter.html
// Keep filters broad by default; use value filters where a topic's Lua only accepts known values.
// Per-topic osmium tag-filter profiles (see topics.const.ts → tagFilterProfile).

const topicTagFilterProfiles = {
  // roads_bikelanes + trafficSigns (sign nodes need n/traffic_sign*; ways need w/highway).
  roadsBikelanes: ['w/highway', 'n/traffic_sign*'],
  barriers: [
    'w/railway',
    'w/waterway',
    // barrier_lines.lua trunk/motorway only — keep in sync with highway_classes.lua > trunk_motorway_classes
    'w/highway=motorway,motorway_link,trunk,trunk_link',
    'wr/natural',
    'wr/aeroway',
  ],
  landcover: ['wr/landuse', 'wr/building', 'wr/leisure'],
  // Documented parking-minimum expressions (parking topic uses monolithicUnion for identical inputs).
  parking: [
    'nwr/amenity',
    'nw/area:highway',
    'nw/barrier',
    'nw/bicycle_parking:position',
    'nw/bicycle_rental:position',
    'nw/crossing',
    'nw/crossing_ref',
    'nw/crossing:buffer_marking',
    'nw/crossing:kerb_extension',
    'nw/crossing:markings',
    'nw/emergency',
    'nw/highway',
    'nw/landuse',
    'wr/landuse',
    'nw/leisure',
    'nw/man_made',
    'nw/mobility_hub:position',
    'nw/motorcycle_parking:position',
    'nw/natural',
    'nw/outdoor_seating',
    'nw/position',
    'nw/public_transport',
    'nw/railway',
    'nw/road_marking',
    'nw/small_electric_vehicle_parking:position',
    'n/traffic_sign*',
    'nwr/obstacle:parking=yes',
    // Off-street parking areas from building=* — keep in sync with sanitize_parking_tags.lua
    // (parking_off_street) and off_street_parking_area_categories.lua.
    'wr/building=carport',
    'wr/building=garage',
    'wr/building=garages',
    'wr/building=parking',
    'w/kerb',
    'w/parking',
    'w/traffic_calming',
  ],
  relations: [
    // boundaries_relations.lua
    'r/boundary=administrative',
    // bikeroutes_relations.lua
    'r/route=bicycle',
  ],
  features: [
    'nwr/amenity',
    'nwr/shop',
    'nwr/place',
    // publicTransport also imports railway station/halt/tram_stop ways.
    'w/railway=station,halt,tram_stop',
    'nw/public_transport',
    // poiClassification imports leisure POIs; this replaces the old union of wr/leisure + nw/leisure.
    'nwr/leisure',
    'nw/tourism',
  ],
} as const satisfies Record<string, readonly string[]>

// Exact former filter-expressions.txt union (pre per-topic split). Parking still needs this
// breadth — a computed union of narrower topic profiles is not equivalent.
export const legacyMonolithicExpressions = [
  'r/boundary',
  'nwr/amenity',
  'nwr/shop',
  'nwr/place',
  'wr/landuse',
  'wr/building',
  'wr/leisure',
  'w/railway',
  'w/waterway',
  'w/highway',
  'wr/natural',
  'wr/aeroway',
  'w/public_transport',
  'n/public_transport',
  'nw/tourism',
  'n/traffic_sign*',
  'r/route',
  'nw/amenity',
  'nw/area:highway',
  'nw/barrier',
  'nw/bicycle_parking:position',
  'nw/bicycle_rental:position',
  'nw/crossing',
  'nw/crossing_ref',
  'nw/crossing:buffer_marking',
  'nw/crossing:kerb_extension',
  'nw/crossing:markings',
  'nw/highway',
  'nw/leisure',
  'nw/man_made',
  'nw/mobility_hub:position',
  'nw/motorcycle_parking:position',
  'nw/natural',
  'nw/outdoor_seating',
  'nw/position',
  'nw/road_marking',
  'nw/small_electric_vehicle_parking:position',
  'nwr/obstacle:parking=yes',
  'w/amenity=parking',
  'w/building=carport',
  'w/building=garage',
  'w/building=garages',
  'w/building=parking',
  'w/kerb',
  'w/parking',
  'w/traffic_calming',
] as const

export const tagFilterProfiles = {
  ...topicTagFilterProfiles,
  monolithicUnion: legacyMonolithicExpressions,
} as const satisfies Record<string, readonly string[]>

export type TagFilterProfile = keyof typeof tagFilterProfiles

export function profileFilteredFileName(profile: TagFilterProfile) {
  return `${profile}.osm.pbf`
}

export const tagFilterProfileHashKey = (profile: TagFilterProfile, outputFileName: string) =>
  `tag-filter-profile/${profile}/${outputFileName}`
