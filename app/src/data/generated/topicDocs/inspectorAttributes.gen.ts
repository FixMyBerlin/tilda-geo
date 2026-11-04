import type { TopicDocInspectorAttributes } from '../../topicDocs/inspector'

const data = {
  atlas_barriers: {
    natural: {
      type: 'string',
    },
    aerodrome: {
      type: 'string',
    },
    area: {
      type: 'number',
    },
    name: {
      type: 'sanitized_strings',
    },
    highway: {
      type: 'string',
    },
    waterway: {
      type: 'string',
    },
    railway: {
      type: 'string',
    },
    usage: {
      type: 'string',
    },
    bridge: {
      type: 'string',
    },
    tunnel: {
      type: 'string',
    },
  },
  atlas_bicycleParking: {
    kind: {
      type: 'string',
    },
    capacity: {
      type: 'number',
    },
    access: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    fee: {
      type: 'string',
    },
    access_cargo_bike: {
      type: 'string',
    },
    lit: {
      type: 'string',
    },
    stand_type: {
      type: 'string',
    },
    rental_type: {
      type: 'string',
    },
    network: {
      type: 'sanitized_strings',
    },
    in_mobility_hub: {
      type: 'string',
    },
    geometry_transform: {
      type: 'string',
    },
    operator_type: {
      type: 'string',
    },
    position: {
      type: 'string',
    },
    indoor: {
      type: 'string',
    },
    surface: {
      type: 'string',
    },
    surveillance: {
      type: 'string',
    },
    count: {
      type: 'number',
    },
    name: {
      type: 'sanitized_strings',
    },
    operator: {
      type: 'sanitized_strings',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    maxstay: {
      type: 'sanitized_strings',
    },
  },
  atlas_bikelanes: {
    category: {
      type: 'string',
    },
    road: {
      type: 'string',
    },
    parent_road: {
      type: 'string',
    },
    parent_maxspeed: {
      type: 'kilometer_per_hour',
    },
    adjoining_road: {
      type: 'string',
    },
    adjoining_maxspeed: {
      type: 'kilometer_per_hour',
    },
    name: {
      type: 'sanitized_strings',
    },
    length: {
      type: 'meter',
    },
    prefix: {
      type: 'string',
      purpose: 'processing',
    },
    lifecycle: {
      type: 'string',
    },
    width: {
      type: 'meter',
    },
    width_effective: {
      type: 'meter',
    },
    width_source: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    oneway: {
      type: 'string',
    },
    bridge: {
      type: 'string',
    },
    tunnel: {
      type: 'string',
    },
    surface_color: {
      type: 'string',
    },
    separation_left: {
      type: 'string',
    },
    separation_right: {
      type: 'string',
    },
    marking_left: {
      type: 'string',
    },
    marking_right: {
      type: 'string',
    },
    buffer_left: {
      type: 'meter',
    },
    buffer_right: {
      type: 'meter',
    },
    traffic_mode_left: {
      type: 'string',
    },
    traffic_mode_right: {
      type: 'string',
    },
    mapillary_coverage: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    mapillary_forward: {
      type: 'sanitized_strings',
    },
    mapillary_backward: {
      type: 'sanitized_strings',
    },
    mapillary_traffic_sign: {
      type: 'sanitized_strings',
    },
    route_relations: {
      type: 'string',
    },
    description: {
      type: 'sanitized_strings',
    },
    operator_type: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    lit: {
      type: 'string',
    },
    offset: {
      type: 'meter',
      purpose: 'rendering',
    },
    surface: {
      type: 'string',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness: {
      type: 'string',
    },
    smoothness_source: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    'traffic_sign:forward': {
      type: 'sanitized_strings',
    },
    'traffic_sign:backward': {
      type: 'sanitized_strings',
    },
    todos: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    _in_settlement_area: {
      type: 'ignore',
      purpose: 'processing',
    },
  },
  atlas_bikelanesPresence: {
    bikelane_left: {
      type: 'string',
    },
    bikelane_self: {
      type: 'string',
    },
    bikelane_right: {
      type: 'string',
    },
  },
  atlas_bikeroutes: {
    distance: {
      type: 'kilometer',
    },
    network: {
      type: 'string',
    },
    cycle_highway: {
      type: 'string',
    },
    roundtrip: {
      type: 'string',
    },
    network_type: {
      type: 'string',
    },
    cycle_network_key: {
      type: 'sanitized_strings',
    },
    symbol_description: {
      type: 'sanitized_strings',
    },
    route_description: {
      type: 'sanitized_strings',
    },
    name: {
      type: 'sanitized_strings',
    },
    ref: {
      type: 'sanitized_strings',
    },
    operator: {
      type: 'sanitized_strings',
    },
    website: {
      type: 'sanitized_strings',
    },
    wikipedia: {
      type: 'sanitized_strings',
    },
    colours: {
      type: 'sanitized_strings',
    },
  },
  atlas_bikeSuitability: {
    bikeSuitability: {
      type: 'string',
    },
    road: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    length: {
      type: 'meter',
    },
    lifecycle: {
      type: 'string',
    },
    mapillary_coverage: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    mapillary_forward: {
      type: 'sanitized_strings',
    },
    mapillary_backward: {
      type: 'sanitized_strings',
    },
    mapillary_traffic_sign: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    operator_type: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    surface: {
      type: 'string',
    },
    smoothness: {
      type: 'string',
    },
  },
  atlas_boundaries: {
    admin_level: {
      type: 'number',
    },
    population: {
      type: 'population_label',
    },
    population_date: {
      type: 'date',
    },
    name: {
      type: 'sanitized_strings',
    },
    name_prefix: {
      type: 'sanitized_strings',
    },
    wikidata: {
      type: 'sanitized_strings',
    },
    wikipedia: {
      type: 'sanitized_strings',
    },
    regionalschluessel: {
      type: 'sanitized_strings',
    },
    category_municipality: {
      type: 'string',
    },
    category_district: {
      type: 'string',
    },
  },
  atlas_landuse: {
    landuse: {
      type: 'string',
    },
    access: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    operator: {
      type: 'sanitized_strings',
    },
  },
  atlas_places: {
    place: {
      type: 'string',
    },
    capital: {
      type: 'string',
    },
    population: {
      type: 'population_label',
    },
    population_date: {
      type: 'date',
    },
    admin_level: {
      type: 'number',
    },
    name: {
      type: 'sanitized_strings',
    },
    website: {
      type: 'sanitized_strings',
    },
    wikidata: {
      type: 'sanitized_strings',
    },
    wikipedia: {
      type: 'sanitized_strings',
    },
  },
  atlas_poiClassification: {
    name: {
      type: 'sanitized_strings',
    },
    addr_street: {
      type: 'sanitized_strings',
    },
    addr_zip: {
      type: 'sanitized_strings',
    },
    addr_city: {
      type: 'sanitized_strings',
    },
    addr_number: {
      type: 'sanitized_strings',
    },
    category: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
    formalEducation: {
      type: 'string',
    },
  },
  atlas_publicTransport: {
    category: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    operator: {
      type: 'sanitized_strings',
    },
    wikidata: {
      type: 'sanitized_strings',
    },
    wikipedia: {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    network: {
      type: 'sanitized_strings',
    },
    network_short: {
      type: 'sanitized_strings',
    },
  },
  atlas_roads: {
    road: {
      type: 'string',
    },
    highway: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    name_ref: {
      type: 'sanitized_strings',
    },
    length: {
      type: 'meter',
    },
    lifecycle: {
      type: 'string',
    },
    width: {
      type: 'meter',
    },
    width_effective: {
      type: 'meter',
    },
    width_source: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    oneway: {
      type: 'string',
    },
    oneway_bicycle: {
      type: 'string',
    },
    bridge: {
      type: 'string',
    },
    tunnel: {
      type: 'string',
    },
    mapillary_coverage: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    mapillary_forward: {
      type: 'sanitized_strings',
    },
    mapillary_backward: {
      type: 'sanitized_strings',
    },
    mapillary_traffic_sign: {
      type: 'sanitized_strings',
    },
    route_relations: {
      type: 'string',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    'traffic_sign:forward': {
      type: 'sanitized_strings',
    },
    'traffic_sign:backward': {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    operator_type: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    bikelane_left: {
      type: 'string',
    },
    bikelane_self: {
      type: 'string',
    },
    bikelane_right: {
      type: 'string',
    },
    maxspeed: {
      type: 'kilometer_per_hour',
    },
    maxspeed_source: {
      type: 'string',
      purpose: 'qa',
    },
    maxspeed_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    'osm_maxspeed:backward': {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    'osm_maxspeed:forward': {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    'osm_maxspeed:conditional': {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    lit: {
      type: 'string',
    },
    surface: {
      type: 'string',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness: {
      type: 'string',
    },
    smoothness_source: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface_color: {
      type: 'string',
    },
    todos: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    _is_sidepath: {
      type: 'ignore',
      purpose: 'processing',
    },
    _in_settlement_area: {
      type: 'ignore',
      purpose: 'processing',
    },
  },
  atlas_roadsPathClasses: {
    road: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    length: {
      type: 'meter',
    },
    lifecycle: {
      type: 'string',
    },
    oneway: {
      type: 'string',
    },
    oneway_bicycle: {
      type: 'string',
    },
    mapillary_coverage: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    mapillary_forward: {
      type: 'sanitized_strings',
    },
    mapillary_backward: {
      type: 'sanitized_strings',
    },
    mapillary_traffic_sign: {
      type: 'sanitized_strings',
    },
    route_relations: {
      type: 'string',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    operator_type: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    lit: {
      type: 'string',
    },
    width: {
      type: 'meter',
    },
    width_source: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    surface: {
      type: 'string',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness: {
      type: 'string',
    },
    smoothness_source: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface_color: {
      type: 'string',
    },
    bikelane_left: {
      type: 'string',
    },
    bikelane_self: {
      type: 'string',
    },
    bikelane_right: {
      type: 'string',
    },
    todos: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    adjoining_road: {
      type: 'string',
    },
    adjoining_maxspeed: {
      type: 'kilometer_per_hour',
    },
    _is_sidepath: {
      type: 'ignore',
      purpose: 'processing',
    },
    _in_settlement_area: {
      type: 'ignore',
      purpose: 'processing',
    },
  },
  atlas_todos_lines: {
    source_table: {
      type: 'string',
    },
    length: {
      type: 'meter',
    },
    todos: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
  },
  atlas_trafficSigns: {
    traffic_sign: {
      type: 'sanitized_strings',
    },
    offset: {
      type: 'meter',
    },
    direction: {
      type: 'number',
    },
    direction_source: {
      type: 'string',
      purpose: 'qa',
    },
    description: {
      type: 'sanitized_strings',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    'osm_traffic_sign:direction': {
      type: 'sanitized_strings',
      purpose: 'experimentation',
    },
    'osm_traffic_sign:forward': {
      type: 'sanitized_strings',
      purpose: 'experimentation',
    },
    'osm_traffic_sign:backward': {
      type: 'sanitized_strings',
      purpose: 'experimentation',
    },
    'osm_traffic_sign:both': {
      type: 'sanitized_strings',
      purpose: 'experimentation',
    },
    osm_direction: {
      type: 'sanitized_strings',
      purpose: 'experimentation',
    },
  },
  tilda_highwayAreas: {
    road: {
      type: 'string',
    },
    name: {
      type: 'sanitized_strings',
    },
    area: {
      type: 'square_meter',
    },
    lifecycle: {
      type: 'string',
    },
    oneway: {
      type: 'string',
    },
    oneway_bicycle: {
      type: 'string',
    },
    mapillary_coverage: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    mapillary_forward: {
      type: 'sanitized_strings',
    },
    mapillary_backward: {
      type: 'sanitized_strings',
    },
    mapillary_traffic_sign: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    description: {
      type: 'sanitized_strings',
    },
    operator_type: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    lit: {
      type: 'string',
    },
    width: {
      type: 'meter',
    },
    width_source: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    bridge: {
      type: 'string',
    },
    tunnel: {
      type: 'string',
    },
    surface: {
      type: 'string',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness: {
      type: 'string',
    },
    smoothness_source: {
      type: 'string',
      purpose: 'qa',
    },
    smoothness_confidence: {
      type: 'string',
      purpose: 'qa',
    },
  },
  tilda_parkings: {
    parking: {
      type: 'string',
    },
    capacity: {
      type: 'number',
    },
    capacity_source: {
      type: 'string',
      purpose: 'qa',
    },
    orientation: {
      type: 'string',
    },
    condition_category: {
      type: 'string',
    },
    condition_category_primary: {
      type: 'string',
      purpose: 'rendering',
    },
    staggered: {
      type: 'string',
    },
    length: {
      type: 'meter',
    },
    category: {
      type: 'string',
    },
    source: {
      type: 'string',
    },
    geom_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    tag_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    road: {
      type: 'string',
    },
    road_name: {
      type: 'sanitized_strings',
    },
    road_oneway: {
      type: 'string',
    },
    road_width: {
      type: 'meter',
    },
    road_width_source: {
      type: 'string',
      purpose: 'qa',
    },
    road_width_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    side: {
      type: 'string',
    },
    area: {
      type: 'square_meter',
    },
    area_source: {
      type: 'string',
      purpose: 'qa',
    },
    area_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    capacity_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface: {
      type: 'string',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    direction: {
      type: 'string',
    },
    location: {
      type: 'string',
    },
    markings: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    access: {
      type: 'string',
    },
    operator_type: {
      type: 'string',
    },
    operator_type_source: {
      type: 'string',
      purpose: 'qa',
    },
    operator_type_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    informal: {
      type: 'string',
    },
    zone: {
      type: 'sanitized_strings',
    },
    reason: {
      type: 'string',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    _staggered_maneuvering_loss: {
      type: 'number',
      purpose: 'qa',
    },
    _staggered_original_capacity: {
      type: 'number',
      purpose: 'qa',
    },
    name: {
      type: 'sanitized_strings',
    },
    highway: {
      type: 'string',
    },
    capacity_left: {
      type: 'number',
    },
    capacity_right: {
      type: 'number',
    },
    capacity_private_left: {
      type: 'number',
    },
    capacity_private_right: {
      type: 'number',
    },
    operator_type_left: {
      type: 'string',
    },
    operator_type_right: {
      type: 'string',
    },
    condition_category_left: {
      type: 'string',
      purpose: 'rendering',
    },
    condition_category_right: {
      type: 'string',
      purpose: 'rendering',
    },
    parking_left: {
      type: 'string',
    },
    parking_right: {
      type: 'string',
    },
    surface_left: {
      type: 'string',
      purpose: 'rendering',
    },
    surface_right: {
      type: 'string',
      purpose: 'rendering',
    },
    way_ids: {
      type: 'sanitized_strings',
      purpose: 'processing',
    },
    way_reversed: {
      type: 'sanitized_strings',
      purpose: 'processing',
    },
    start_node: {
      type: 'number',
    },
    end_node: {
      type: 'number',
    },
    angle: {
      type: 'number',
      purpose: 'rendering',
    },
  },
  tilda_parkings_cutouts: {
    category: {
      type: 'string',
    },
    source: {
      type: 'string',
    },
    buffer_radius: {
      type: 'meter',
    },
    radius: {
      type: 'meter',
    },
    side: {
      type: 'string',
    },
    width: {
      type: 'meter',
    },
    no_cutout_for_restrictions: {
      type: 'string',
    },
    road: {
      type: 'sanitized_strings',
    },
    'street:name': {
      type: 'sanitized_strings',
    },
    amenity: {
      type: 'sanitized_strings',
    },
    barrier: {
      type: 'sanitized_strings',
    },
    capacity: {
      type: 'number',
    },
    'capacity:cargo_bike': {
      type: 'number',
    },
    direction: {
      type: 'sanitized_strings',
    },
    emergency: {
      type: 'sanitized_strings',
    },
    geom_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    geometry_source: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    kerb: {
      type: 'sanitized_strings',
    },
    landuse: {
      type: 'sanitized_strings',
    },
    man_made: {
      type: 'sanitized_strings',
    },
    name: {
      type: 'sanitized_strings',
    },
    natural: {
      type: 'sanitized_strings',
    },
    operator: {
      type: 'sanitized_strings',
    },
    ref: {
      type: 'sanitized_strings',
    },
    separate_parking: {
      type: 'sanitized_strings',
    },
    tag_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    traffic_calming: {
      type: 'sanitized_strings',
    },
    'osm_area:highway': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_barrier: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_capacity: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_crossing: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_crossing:buffer_marking': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_crossing:kerb_extension': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_crossing:continuous': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_crossing:markings': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_crossing:signals': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_crossing_ref: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_fire_hydrant:position': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_fire_hydrant:type': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_highway: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_leisure: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_mapillary: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_natural: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_network: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_outdoor_seating: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_position: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_ref: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_road_marking: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    'osm_small_electric_vehicle_parking:position': {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_street_cabinet: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_traffic_calming: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_traffic_sign: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_vending: {
      type: 'ignore',
      purpose: 'experimentation',
    },
    osm_zone: {
      type: 'ignore',
      purpose: 'experimentation',
    },
  },
  tilda_parkings_no: {
    parking: {
      type: 'string',
    },
    reason: {
      type: 'string',
    },
    condition_category: {
      type: 'string',
    },
    condition_category_primary: {
      type: 'string',
      purpose: 'rendering',
    },
    capacity: {
      type: 'number',
    },
    capacity_source: {
      type: 'string',
      purpose: 'qa',
    },
    orientation: {
      type: 'string',
    },
    staggered: {
      type: 'string',
    },
    source: {
      type: 'string',
    },
    geom_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    tag_sources: {
      type: 'sanitized_strings',
      purpose: 'qa',
    },
    road: {
      type: 'string',
    },
    road_name: {
      type: 'sanitized_strings',
    },
    road_oneway: {
      type: 'string',
    },
    road_width: {
      type: 'meter',
    },
    road_width_source: {
      type: 'string',
      purpose: 'qa',
    },
    road_width_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    side: {
      type: 'string',
    },
    area: {
      type: 'square_meter',
    },
    area_source: {
      type: 'string',
      purpose: 'qa',
    },
    area_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    capacity_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface: {
      type: 'string',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    direction: {
      type: 'string',
    },
    location: {
      type: 'string',
    },
    markings: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    access: {
      type: 'string',
    },
    operator_type: {
      type: 'string',
    },
    operator_type_source: {
      type: 'string',
      purpose: 'qa',
    },
    operator_type_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    informal: {
      type: 'string',
    },
    zone: {
      type: 'sanitized_strings',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
    _staggered_maneuvering_loss: {
      type: 'number',
      purpose: 'qa',
    },
    _staggered_original_capacity: {
      type: 'number',
      purpose: 'qa',
    },
  },
  tilda_parkings_off_street: {
    category: {
      type: 'string',
    },
    parking: {
      type: 'string',
    },
    amenity: {
      type: 'string',
    },
    capacity: {
      type: 'number',
    },
    capacity_source: {
      type: 'string',
      purpose: 'qa',
    },
    condition_category: {
      type: 'string',
    },
    condition_category_primary: {
      type: 'string',
      purpose: 'rendering',
    },
    access: {
      type: 'string',
    },
    area: {
      type: 'square_meter',
    },
    area_source: {
      type: 'string',
      purpose: 'qa',
    },
    area_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    capacity_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface: {
      type: 'string',
    },
    surface_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    surface_source: {
      type: 'string',
      purpose: 'qa',
    },
    orientation: {
      type: 'string',
    },
    location: {
      type: 'string',
    },
    markings: {
      type: 'string',
    },
    covered: {
      type: 'string',
    },
    informal: {
      type: 'string',
    },
    operator_type: {
      type: 'string',
    },
    operator_type_source: {
      type: 'string',
      purpose: 'qa',
    },
    operator_type_confidence: {
      type: 'string',
      purpose: 'qa',
    },
    zone: {
      type: 'sanitized_strings',
    },
    mapillary: {
      type: 'sanitized_strings',
    },
    traffic_sign: {
      type: 'sanitized_strings',
    },
  },
} as const satisfies TopicDocInspectorAttributes

export default data
