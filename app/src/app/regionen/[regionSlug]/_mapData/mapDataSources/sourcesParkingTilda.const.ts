import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import {
  SIMPLIFY_MAX_ZOOM,
  SIMPLIFY_MIN_ZOOM,
} from '@/src/server/instrumentation/registerGeneralizationFunctions'
import { MapDataSource } from '../types'
import { SourceExportApiIdentifier } from './export/exportIdentifier'

export type SourcesParkingTildaId =
  | 'tilda_parkings'
  | 'tilda_parkings_cutouts'
  | 'tilda_parkings_quantized'
  | 'tilda_parkings_separate'
  | 'tilda_parkings_no'

export const sourcesParkingTilda: MapDataSource<
  SourcesParkingTildaId,
  SourceExportApiIdentifier
>[] = [
  {
    id: 'tilda_parkings',
    tiles: getTilesUrl('/atlas_generalized_parkings,atlas_generalized_parkings_labels/{z}/{x}/{y}'),
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
        // New condition fields

        // Road fields
        'name',
        'road',
        'operator_type',
        'condition_category',
        'condition_vehicles',
        'parking',
        'orientation',
        'position',
        'direction',
        'composit_capacity',
        'markings__if_present',
        'reason__if_present',
        'staggered__if_present',
        'restriction__if_present',
        'restriction_bus__if_present',
        'restriction_hgv__if_present',
        'restriction_reason__if_present',
        'fee__if_present',
        'maxstay__if_present',
        'maxstay_motorhome__if_present',
        'access__if_present',
        'private__if_present',
        'disabled__if_present',
        'charge__if_present',
        'taxi__if_present',
        'motorcar__if_present',
        'hgv__if_present',
        'zone__if_present',
        'authentication_disc__if_present',
        'composit_road_width',
        'composit_surface_smoothness',
      ],
    },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'parkings',
      title: 'Parkraum',
      desc: 'Prozessierte Parkraumdaten aus OpenStreetMap',
    },
  },
  {
    id: 'tilda_parkings_cutouts',
    tiles: getTilesUrl('/atlas_generalized_parkings_cutouts/{z}/{x}/{y}'),
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
        'category',
        'source',
        'buffer_radius',
        'condition_category',
        'condition_vehicles',
      ],
    },
    calculator: { enabled: false },
    export: {
      enabled: false,
      // enabled: true,
      // apiIdentifier: 'parkings_cutouts',
      // title: 'Parkraum Aussparungen',
      // desc: 'Aussparungen im Parkraum (z.B. Einfahrten, Kreuzungen)',
    },
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
      documentedKeys: ['capacity', 'operator_type', 'condition_category', 'condition_vehicles'],
    },
    calculator: {
      enabled: true,
      keys: ['capacity'],
      queryLayers: [
        'source:tilda_parkings_quantized--subcat:parkingTildaQuantized--style:default--layer:parking-points',
      ],
      highlightingKey: 'id',
    },
    export: {
      enabled: false,
      // enabled: true,
      // apiIdentifier: 'parkings_quantized',
      // title: 'Parkraum Quantisiert',
      // desc: 'Quantisierte Parkraumdaten für Zählungen',
    },
  },
  {
    id: 'tilda_parkings_separate',
    tiles: getTilesUrl(
      '/atlas_generalized_parkings_separate,atlas_generalized_parkings_separate_labels/{z}/{x}/{y}',
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
        'condition_category',
        'condition_vehicles',
        'composit_capacity',
        'parking',
        'access',
        'operator_type',
        'capacity',
        'building',
        'fee',
        'markings',
        'orientation',
        'surface',
        'description',
      ],
    },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'parkings_separate',
      title: 'Separate Parkplätze',
      desc: 'Separate Parkplatzflächen (nicht an Straßen)',
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
        'parking',
        'capacity',
        'operator_type',
        'condition_category',
        'condition_vehicles',
      ],
    },
    calculator: { enabled: false },
    export: {
      enabled: true,
      apiIdentifier: 'parkings_no',
      title: 'Parkverbote',
      desc: 'Bereiche mit Parkverboten',
    },
  },
]
