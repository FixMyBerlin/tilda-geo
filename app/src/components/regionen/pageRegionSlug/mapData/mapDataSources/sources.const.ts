import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { SIMPLIFY_MAX_ZOOM, SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import type { MapDataSource } from '../types'
import type { SourcesParkingLarsId } from './sourcesParkingLars.const'
import { sourcesParkingLars } from './sourcesParkingLars.const'
import type { SourcesParkingTildaId } from './sourcesParkingTilda.const'
import { sourcesParkingTilda } from './sourcesParkingTilda.const'

type TildaSourceId =
  | 'atlas_barriers'
  | 'atlas_bicycleParking'
  | 'atlas_bikelanes'
  | 'atlas_bikeroutes'
  | 'atlas_boundaries'
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
  | 'tilda_highwayAreas'

// TODO type MapDataConfigSourcesIds = typeof sources[number]['id']
export type SourcesId = SourcesParkingLarsId | SourcesParkingTildaId | TildaSourceId

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
        'description__if_present',
        'length',
        // Last: links to photos, not a property of the object.
        'composit_mapillary',
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
        'width',
        'length',
        'description__if_present',
        // Last: links to photos, not a property of the object.
        'composit_mapillary',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    calculator: { enabled: false },
  },
  {
    id: 'tilda_highwayAreas',
    tileTables: ['highwayAreas'],
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
        'road',
        'oneway__if_present',
        'oneway_bicycle__if_present',
        'lit__if_present',
        'composit_surface_smoothness',
        'traffic_sign',
        'width__if_present',
        'bridge__if_present',
        'tunnel__if_present',
        'area',
        'description__if_present',
      ],
    },
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
        'width',
        'length',
        'description__if_present',
        // Last: links to photos, not a property of the object.
        'composit_mapillary',
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
        'description__if_present',
        // Last: links to photos, not a property of the object.
        'composit_mapillary',
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
]
