import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import {
  SIMPLIFY_MAX_ZOOM,
  SIMPLIFY_MIN_ZOOM,
} from '@/src/server/instrumentation/registerGeneralizationFunctions'
import { MapDataSource } from '../types'

export type SourcesParkingTildaId =
  | 'tilda_parkings'
  | 'tilda_parkings_cutouts'
  | 'tilda_parkings_quantized'
  | 'tilda_parkings_no'
  | 'tilda_parkings_off_street'
  | 'tilda_parkings_off_street_quantized'

export const sourcesParkingTilda: MapDataSource<SourcesParkingTildaId>[] = [
  {
    id: 'tilda_parkings',
    tiles: getTilesUrl(
      // NOTE: We have the lines, the labels and the areas (as "shadow" data) in one response
      '/atlas_generalized_parkings,atlas_generalized_parkings_labels,atlas_generalized_parkings_separate/{z}/{x}/{y}',
    ),
    minzoom: SIMPLIFY_MIN_ZOOM,
    // We need to apply a higher maxzoom here so the data from parkings_separate gets loaded that is only visible starting at 17
    // We could add the "separate" from 14 (our default) and only hide it visually.
    // But I assume that this approach has smaller data (and higher geometric accuracy).
    // maxzoom: SIMPLIFY_MAX_ZOOM,
    maxzoom: 17, // See processing/topics/parking/7_finalize_parkings.sql:89
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        'parking',
        'informal__if_present',
        'capacity',
        'staggered__if_present',
        'orientation',
        'direction__if_present',
        'condition_category',
        'condition_vehicles__if_present',
        'reason__if_present',
        'traffic_sign',
        'zone__if_present',
        'fee__if_present',
        'covered__if_present',
        'location__if_present',
        'markings__if_present',
        'access__if_present',
        'composit_surface_smoothness',
        'area',
        'source',
        // 'side',
        // Road
        'road',
        'road_name',
        'composit_road_width',
        'operator_type',
        'road_oneway__if_present',
        // OTHER
        'composit_mapillary',
      ],
    },
    calculator: { enabled: false },
  },
  {
    id: 'tilda_parkings_cutouts',
    tiles: getTilesUrl('/atlas_generalized_parkings_cutouts/{z}/{x}/{y}'),
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: 17, // higher than default to fix geometric precision for circles and such
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        //
        'category',
        'source',
        'buffer_radius__if_present',
      ],
    },
    calculator: { enabled: false },
  },
  {
    id: 'tilda_parkings_quantized',
    tiles: getTilesUrl('/atlas_generalized_parkings_quantized/{z}/{x}/{y}'),
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
        'operator_type',
        'condition_category',
        'condition_vehicles__if_present',
      ],
    },
    calculator: {
      enabled: true,
      keys: ['capacity'],
      queryLayers: [
        'source:tilda_parkings_quantized--subcat:parkingTildaQuantized--style:default--layer:parking-points',
      ],
      highlightingKey: 'id',
    },
  },
  {
    id: 'tilda_parkings_off_street_quantized',
    tiles: getTilesUrl('/atlas_generalized_off_street_parking_quantized/{z}/{x}/{y}'),
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
        'operator_type',
        'condition_category',
        'condition_vehicles__if_present',
      ],
    },
    calculator: {
      enabled: true,
      keys: ['capacity'],
      queryLayers: [
        'source:tilda_parkings_off_street_quantized--subcat:parkingTildaQuantizedOffStreet--style:default--layer:parking-points',
      ],
      highlightingKey: 'id',
    },
  },
  {
    id: 'tilda_parkings_no',
    tiles: getTilesUrl('/atlas_generalized_parkings_no/{z}/{x}/{y}'),
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
        //
        'reason__if_present',
        'parking',
        'composit_mapillary',
      ],
    },
    calculator: { enabled: false },
  },
  {
    id: 'tilda_parkings_off_street',
    tiles: getTilesUrl(
      '/atlas_generalized_off_street_parking_areas,atlas_generalized_off_street_parking_area_labels,atlas_generalized_off_street_parking_points/{z}/{x}/{y}',
    ),
    minzoom: SIMPLIFY_MIN_ZOOM,
    maxzoom: 17, // higher than default to fix geometric precision for circles and such
    attributionHtml:
      '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>; <a href="https://tilda-geo.de">tilda-geo.de</a>',
    licence: 'ODbL',
    promoteId: 'id',
    osmIdConfig: { osmTypeId: 'id' },
    inspector: {
      enabled: true,
      highlightingKey: 'id',
      documentedKeys: [
        //
        // New condition fields
        'parking',
        'informal__if_present',
        'orientation',
        'direction__if_present',
        'condition_category',
        'condition_vehicles__if_present',
        'traffic_sign',
        'zone__if_present',
        'covered__if_present',
        'fee__if_present',
        'location__if_present',
        'markings__if_present',
        'reason__if_present',
        'access__if_present',
        'surface',
        'composit_surface_smoothness',
        'area',
        'source',
        'operator_type',
        // OTHER
        'composit_mapillary',
      ],
    },
    calculator: { enabled: false },
  },
]
