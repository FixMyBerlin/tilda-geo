import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import {
  SIMPLIFY_MAX_ZOOM,
  SIMPLIFY_MIN_ZOOM,
} from '@/src/server/instrumentation/registerGeneralizationFunctions'
import { MapDataSource } from '../types'
import { apiKeyMapbox, apiKeyMapillary } from './apiKeys.const'
import { SourceExportApiIdentifier } from './export/exportIdentifier'
import { sourcesParking, SourcesParkingId } from './sourcesParking.const'
import { SourceVerificationApiIdentifier } from './verification/verificationIdentifier'

type AtlasSourceId =
  | 'atlas_barriers'
  | 'atlas_bicycleParking'
  | 'atlas_bikelanes'
  | 'atlas_bikeroutes'
  | 'atlas_boundaries'
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
  | SourcesParkingId
  | AtlasSourceId
  | MapillarySourceId
  | 'accidents_unfallatlas'

export const sources: MapDataSource<
  SourcesId,
  SourceVerificationApiIdentifier,
  SourceExportApiIdentifier
>[] = [
  ...sourcesParking,
  {
    id: 'atlas_boundaries',
    tiles: getTilesUrl(
      '/atlas_generalized_boundaries,atlas_generalized_boundarylabels/{z}/{x}/{y}',
    ),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
  },
  {
    id: 'atlas_presenceStats',
    tiles: getTilesUrl('/presenceStats/{z}/{x}/{y}'),
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
        'name:prefix',
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
  },
  {
    id: 'accidents_unfallatlas',
    // TODO Migrieren auf Maptiler
    tiles: `https://api.mapbox.com/v4/hejco.5oexnrgf/{z}/{x}/{y}.vector.pbf?sku=101bSz70Afq22&access_token=${apiKeyMapbox}`,
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
  },
  {
    id: 'atlas_bikelanes',
    tiles: getTilesUrl('/atlas_generalized_bikelanes/{z}/{x}/{y}'),
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
        'composit_highway',
        'category',
        'oneway',
        'traffic_sign',
        'width',
        'composit_surface_smoothness',
        'osm_surface:color__if_present',
        'composit_mapillary',
        'description__if_present',
        'length',
      ],
    },
    // presence: { enabled: true },
    verification: {
      enabled: false,
      // apiIdentifier: 'bikelanes',
    },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'bikelanes',
      title: 'Fahrradinfrastruktur',
      desc: 'Prozessierte Infrastrukturdaten (ohne Mischverkehr)',
    },
  },
  {
    id: 'atlas_bikeroutes',
    tiles: getTilesUrl('/atlas_generalized_bikeroutes/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'bikeroutes',
      title: 'Fahrradrouten',
      desc: 'Ausgeschilderte Fahrradrouten aus OpenStreetMap',
    },
  },
  {
    id: 'atlas_roads',
    tiles: getTilesUrl('/atlas_generalized_roads/{z}/{x}/{y}'),
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
        'composit_lit',
        'composit_maxspeed',
        'traffic_sign',
        'composit_mapillary',
        'description__if_present',
        'length',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'roads',
      title: 'Straßennetz',
      desc: 'Haupt- und Nebenstraßen, Beleuchtung, Oberfläche, Höchstgeschwindigkeit, Vollständigkeit RVA',
    },
  },
  {
    id: 'atlas_roadsPathClasses',
    tiles: getTilesUrl('/atlas_generalized_roadspathclasses/{z}/{x}/{y}'),
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
        'composit_lit',
        'composit_maxspeed',
        'traffic_sign',
        'composit_mapillary',
        'description__if_present',
        'length',
      ],
    },
    // presence: { enabled: false }, // this is false until we are able to merge the `bikelanesPresence` with `bikelanes`
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'roadsPathClasses',
      title: 'Straßennetz Wege',
      desc: 'Fuß-, Wald-, Feld-, Reit-, Fahrradwege, Treppen',
    },
  },
  {
    id: 'atlas_bikelanesPresence',
    tiles: getTilesUrl('/atlas_generalized_bikelanespresence/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false }, // can be exported as part of `roads`, `roadsPathClasses`
  },
  {
    id: 'atlas_bikeSuitability',
    tiles: getTilesUrl('/atlas_generalized_bikesuitability/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false }, // can be exported as part of `roads`, `roadsPathClasses`
  },
  {
    id: 'atlas_publicTransport',
    tiles: getTilesUrl('/atlas_generalized_publictransport/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'publicTransport',
      title: 'ÖPNV-Haltepunkte und Fähranleger',
      desc: 'Punktdaten von Haltestellen',
    },
  },
  {
    id: 'atlas_poiClassification',
    tiles: getTilesUrl('/atlas_generalized_poiclassification/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'poiClassification',
      title: 'POI Einkauf, Freizeit, Bildung',
      desc: 'Kategorisiert Punktdaten. Bildungsdaten können über `formalEducation` gefiltert werden.',
    },
  },
  {
    id: 'atlas_places',
    tiles: getTilesUrl('/atlas_generalized_places/{z}/{x}/{y}'),
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
      documentedKeys: ['name', 'place', 'population', 'population:date'],
    },
    // presence: { enabled: false },
    verification: { enabled: false },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'places',
      title: 'Orte',
      desc: 'Punktdaten zu Städten und Dörfern',
    },
  },
  {
    id: 'atlas_barriers',
    tiles: getTilesUrl(
      '/atlas_generalized_barrierareas,atlas_generalized_barrierlines/{z}/{x}/{y}',
    ),
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: SIMPLIFY_MAX_ZOOM,
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: { enabled: false },
    // presence: { enabled: false },
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
  },
  {
    id: 'atlas_landuse',
    tiles: getTilesUrl('/atlas_generalized_landuse/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
  },
  {
    id: 'atlas_bicycleParking',
    tiles: getTilesUrl(
      '/atlas_generalized_bicycleparking_points,atlas_generalized_bicycleparking_areas/{z}/{x}/{y}',
    ),
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
        'composit_mapillary',
        'description__if_present',
      ],
    },
    // presence: { enabled: false },
    verification: { enabled: false },
    calculator: { enabled: false }, // TODO
    export: {
      enabled: true,
      apiIdentifier: 'bicycleParking_points',
      title: 'Fahrradstellplätze',
      desc: 'Alle Fahrradstellplätze. Flächen werden als Punkt ausgegeben.',
    },
  },
  {
    id: 'atlas_trafficSigns',
    tiles: getTilesUrl('/atlas_generalized_trafficsigns/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false }, // TODO
    export: {
      enabled: true,
      apiIdentifier: 'trafficSigns',
      title: 'Verkehrszeichen',
      desc: 'Verkehrszeichen und Routen-Beschilderungen',
    },
  },
  {
    id: 'atlas_aggregated_lengths',
    tiles: getTilesUrl('/aggregated_lengths/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false }, // TODO
    export: { enabled: false },
  },
  {
    id: 'atlas_todos_lines',
    tiles: getTilesUrl('/atlas_generalized_todos_lines/{z}/{x}/{y}'),
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
    verification: { enabled: false },
    calculator: { enabled: false }, // TODO
    export: {
      enabled: true,
      apiIdentifier: 'todos_lines',
      title: 'Aufgaben',
      desc: 'Hinweise zu Aufgaben in den Fahrrad und Straßendaten.',
    },
  },
  {
    // https://www.mapillary.com/developer/api-documentation/#coverage-tiles
    id: 'mapillary_coverage',
    tiles: `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${apiKeyMapillary}`,
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
    verification: { enabled: false },
    calculator: { enabled: false },
    export: { enabled: false },
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
