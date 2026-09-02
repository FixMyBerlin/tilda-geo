import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { SIMPLIFY_MAX_ZOOM, SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import type { MapDataSource } from '../types'
import { apiKeyMapbox, apiKeyMapillary } from './apiKeys.const'
import type { SourcesParkingLarsId } from './sourcesParkingLars.const'
import { sourcesParkingLars } from './sourcesParkingLars.const'
import type { SourcesParkingTildaId } from './sourcesParkingTilda.const'
import { sourcesParkingTilda } from './sourcesParkingTilda.const'

type AtlasSourceId =
  | 'atlas_barriers'
  | 'atlas_bicycleParking'
  | 'atlas_bikelanes'
  | 'atlas_bikeroutes'
  | 'atlas_boundaries'
  | 'atlas_busStopsAndBikeSharing'
  | 'atlas_presenceStats'
  | 'atlas_landuse'
  | 'atlas_places'
  | 'atlas_poiClassification'
  | 'atlas_publicTransport'
  | 'atlas_roads'
  | 'atlas_roadsPathClasses'
  | 'atlas_bikelanesPresence' // based on `roads`
  | 'atlas_bikeSuitability' // based on `roads`
  | 'atlas_trafficSigns'
  | 'atlas_todos_lines'
  | 'atlas_aggregated_lengths'

type MapillarySourceId = 'mapillary_coverage' | 'mapillary_mapfeatures' | 'mapillary_trafficSigns'

// TODO type MapDataConfigSourcesIds = typeof sources[number]['id']
export type SourcesId =
  | SourcesParkingLarsId
  | SourcesParkingTildaId
  | AtlasSourceId
  | MapillarySourceId
  | 'accidents_unfallatlas'

export const sources: MapDataSource<SourcesId>[] = [
  ...sourcesParkingLars,
  ...sourcesParkingTilda,
  {
    id: 'atlas_boundaries',
    tileTables: ['boundaries', 'boundaryLabels'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['name', 'admin_level'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_presenceStats',
    tileTables: null,
    tilesUrl: getTilesUrl('/presenceStats/{z}/{x}/{y}'),
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'name_prefix',
        'name',
        'admin_level',
        'category_municipality__if_present',
        'category_district__if_present',
        //
        'missing_km',
        //
        'data_no_km',
        'assumed_no_km',
        'not_expected_km',
        'separate_geometry_km',
        'cycleway_adjoining_km',
        'cyclewayOnHighway_advisoryOrExclusive_km',
        'footAndCyclewayShared_adjoiningOrIsolated_km',
      ],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'accidents_unfallatlas',
    tileTables: null,
    // TODO Migrieren auf Maptiler
    tilesUrl: `https://api.mapbox.com/v4/hejco.5oexnrgf/{z}/{x}/{y}.vector.pbf?sku=101bSz70Afq22&access_token=${apiKeyMapbox}`,
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: 16, // https://studio.mapbox.com/tilesets/hejco.5oexnrgf/
    attributionHtml: 'Unfallatlas', // TODO
    licence: undefined, // TODO
    promoteId: undefined,
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'unfall_id',
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_bikelanes',
    tileTables: ['bikelanes'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'name',
        'composit_parent_highway',
        'category',
        'informal__if_present',
        'operator_type__if_present',
        'oneway',
        'traffic_sign',
        'width',
        'bridge__if_present',
        'covered__if_present',
        'separation_left__if_present',
        'buffer_left__if_present',
        'marking_left__if_present',
        'traffic_mode_left__if_present',
        'separation_right__if_present',
        'buffer_right__if_present',
        'marking_right__if_present',
        'traffic_mode_right__if_present',
        'composit_surface_smoothness',
        'surface_color__if_present',
        'composit_mapillary',
        'description__if_present',
        'length',
      ],
    },
    // presence: { enabled: true },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_bikeroutes',
    tileTables: ['bikeroutes'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'name',
        'ref',
        'cycle_highway__if_present',
        'operator',
        'network',
        'network_type__if_present',
        'roundtrip__if_present',
        'cycle_network_key__if_present',
        'distance__if_present',
        'symbol_description__if_present',
        'colours__if_present',
        // 'osmc:symbol__if_present', // We need a decoder https://hiking.waymarkedtrails.org/osmc_symbols.html, https://wiki.openstreetmap.org/wiki/DE:Key:osmc:symbol#G%C3%BCltige_Werte_f%C3%BCr_die_jeweiligen_Komponenten
        'wikipedia__if_present',
        'website__if_present',
        'route_description__if_present',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'atlas_roads',
    tileTables: ['roads'],
    minzoom: 8,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        // Same as 'roadsPathClasses'
        'name',
        'road',
        'oneway',
        'oneway_bicycle__if_present',
        'composit_surface_smoothness',
        'surface_color__if_present',
        'lit__if_present',
        'composit_maxspeed',
        'traffic_sign',
        'composit_mapillary',
        'width',
        'length',
        'description__if_present',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'atlas_roadsPathClasses',
    tileTables: ['roadsPathClasses'],
    minzoom: 10,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        // Same as 'roads'
        'name',
        'road',
        'oneway',
        'oneway_bicycle__if_present',
        'composit_surface_smoothness',
        'surface_color__if_present',
        'lit__if_present',
        'composit_maxspeed',
        'traffic_sign',
        'composit_mapillary',
        'width',
        'length',
        'description__if_present',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'atlas_bikelanesPresence',
    tileTables: ['bikelanesPresence'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['composit_road_bikelanes'],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'atlas_bikeSuitability',
    tileTables: ['bikeSuitability'],
    minzoom: 10,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'name',
        'road',
        'bikeSuitability',
        'composit_surface_smoothness',
        'traffic_sign',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'atlas_publicTransport',
    tileTables: ['publicTransport'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['name', 'category'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_busStopsAndBikeSharing',
    // Bundles the `bus_stop` category from `publicTransport` with the `bicycle_rental`
    // POIs from `poiClassification` for the combined "Bushaltestelle + Bikesharing" toggle.
    tileTables: ['publicTransport', 'poiClassification'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['name', 'category', 'type'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_poiClassification',
    tileTables: ['poiClassification'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['name', 'category', 'type'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_places',
    tileTables: ['places'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['name', 'place', 'population', 'population_date'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_barriers',
    tileTables: ['barrierAreas', 'barrierLines'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: { enabled: false },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_landuse',
    tileTables: ['landuse'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['landuse'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  {
    id: 'atlas_bicycleParking',
    tileTables: ['bicycleParking_points', 'bicycleParking_areas'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'capacity',
        'capacity:cargo_bike__if_present',
        'access',
        'covered',
        'operator_type__if_present',
        'lit__if_present',
        'composit_mapillary',
        'description__if_present',
      ],
    },
    // presence: { enabled: false },
    calculator: { enabled: false }, // TODO
  },
  {
    id: 'atlas_trafficSigns',
    tileTables: ['trafficSigns'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: ['traffic_sign'],
    },
    // presence: { enabled: false },
    calculator: { enabled: false }, // TODO
  },
  {
    id: 'atlas_aggregated_lengths',
    tileTables: null,
    tilesUrl: getTilesUrl('/aggregated_lengths/{z}/{x}/{y}'),
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [],
    },
    // presence: { enabled: false },
    calculator: { enabled: false }, // TODO
  },
  {
    id: 'atlas_todos_lines',
    tileTables: ['todos_lines'],
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [],
    },
    // presence: { enabled: false },
    calculator: { enabled: false }, // TODO
  },
  {
    // https://www.mapillary.com/developer/api-documentation/#coverage-tiles
    id: 'mapillary_coverage',
    tileTables: null,
    tilesUrl: `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${apiKeyMapillary}`,
    minzoom: 0,
    maxzoom: 14,
    attributionHtml: 'Daten von Mapillary', // TODO – could not find anything specific; they don't attribute on their own page.
    licence: undefined, // TODO
    promoteId: 'id', // required, because `feautre.id` is not unique and different from `properties.id`
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id', // OR: 'image_id' for points, 'sequence_id' for lines
      editors: [
        {
          name: 'Mapillary Image',
          idKey: 'id',
          urlTemplate: 'https://www.mapillary.com/app/?focus=photo&pKey={editor_id}',
        },
        {
          name: 'Mapillary Panorama',
          idKey: 'id',
          urlTemplate: 'https://www.mapillary.com/app/?panos=true&pKey={editor_id}',
        },
        {
          name: 'Kartaview',
          urlTemplate: 'https://kartaview.org/map/@{latitude},{longitude},{zoom}z',
        },
      ],
    },
    // presence: { enabled: false },
    calculator: { enabled: false },
  },
  // UNUSED ATM:
  // {
  //   // https://www.mapillary.com/developer/api-documentation/#point-tiles
  //   id: 'mapillary_mapfeatures',
  //   tiles: `https://tiles.mapillary.com/maps/vtp/mly_map_feature_point/2/{z}/{x}/{y}?access_token=${apiKeyMapillary}`,
  //   minzoom: 14,
  //   maxzoom: 14,
  //   attributionHtml: 'Daten von Mapillary', // TODO – could not find anything specific; they don't attribute on their own page.
  //   highlightingKey: 'id',
  // },
  // UNUSED ATM:
  // {
  //   // https://www.mapillary.com/developer/api-documentation/#traffic-sign-tiles
  //   id: 'mapillary_trafficSigns',
  //   tiles: `https://tiles.mapillary.com/maps/vtp/mly_map_feature_traffic_sign/2/{z}/{x}/{y}?access_token=${apiKeyMapillary}`,
  //   minzoom: 14,
  //   maxzoom: 14,
  //   attributionHtml: 'Daten von Mapillary', // TODO – could not find anything specific; they don't attribute on their own page.
  //   highlightingKey: 'id',
  // },
]
