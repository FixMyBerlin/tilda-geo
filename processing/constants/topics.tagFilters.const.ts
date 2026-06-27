// Osmium expression syntax: https://docs.osmcode.org/osmium/latest/osmium-tags-filter.html
// Keep filters broad by default; use value filters where a topic's Lua only accepts known values.
// Per-topic osmium tag-filter profiles (see topics.const.ts → tagFilterProfile).

export const tagFilterProfiles = {
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
  parking: [
    // amenity=* used by parking Lua — not all amenities in the bbox (see obstacle_point_categories, two_wheel_parking_helper, off_street_parking_*).
    'nw/amenity=parking,parking_entrance,bicycle_parking,motorcycle_parking,small_electric_vehicle_parking,bicycle_rental,mobility_hub,loading_ramp,recycling,vending_machine',
    'nw/area:highway',
    // obstacle_line_categories.lua + obstacle_point_categories.lua
    'nw/barrier=kerb,bollard,fence,collision_protection',
    'nw/bicycle_parking:position',
    'nw/bicycle_rental:position',
    'nw/small_electric_vehicle_parking:position',
    'nw/crossing',
    'nw/crossing_ref',
    'nw/crossing:buffer_marking',
    'nw/crossing:kerb_extension',
    'nw/crossing:markings',
    'nw/highway',
    // obstacle_area_categories.lua (parklet)
    'nw/leisure=parklet,outdoor_seating',
    // obstacle_point_categories.lua
    'nw/man_made=street_cabinet,water_well',
    'nw/mobility_hub:position',
    'nw/motorcycle_parking:position',
    // obstacle_point_categories.lua (trees as parking obstacles)
    'nw/natural=tree,tree_stump',
    'nw/outdoor_seating=parklet',
    'nw/position',
    'nw/road_marking',
    'nwr/obstacle:parking=yes',
    // Off-street parking areas from building=* — keep in sync with sanitize_parking_tags.lua
    // (parking_off_street) and off_street_parking_area_categories.lua.
    'w/building=carport',
    'w/building=garage',
    'w/building=garages',
    'w/building=parking',
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

export type TagFilterProfile = keyof typeof tagFilterProfiles

export function profileFilteredFileName(profile: TagFilterProfile) {
  return `${profile}.osm.pbf`
}

export const tagFilterProfileHashKey = (profile: TagFilterProfile, outputFileName: string) =>
  `tag-filter-profile/${profile}/${outputFileName}`
