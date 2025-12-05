import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_parking_debug_bus_tram } from './mapboxStyles/groups/parking_debug_bus_tram'
import { mapboxStyleGroupLayers_parking_debug_crossings } from './mapboxStyles/groups/parking_debug_crossings'
import { mapboxStyleGroupLayers_parking_debug_driveways } from './mapboxStyles/groups/parking_debug_driveways'
import { mapboxStyleGroupLayers_parking_debug_kerb } from './mapboxStyles/groups/parking_debug_kerb'
import { mapboxStyleGroupLayers_parking_debug_parking_points } from './mapboxStyles/groups/parking_debug_parking_points'
import { mapboxStyleGroupLayers_parking_debug_parking_poly } from './mapboxStyles/groups/parking_debug_parking_poly'
import { mapboxStyleGroupLayers_parking_debug_ramps } from './mapboxStyles/groups/parking_debug_ramps'
import { mapboxStyleGroupLayers_parking_obstacles } from './mapboxStyles/groups/parking_obstacles'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingDebug'
const source = 'lars_parking_debug'
export type SubcatParkingLarsDebugId = typeof subcatId
export type SubcatParkingLarsDebugStyleIds = 'default' | 'presence' | 'debugLengthPerCapacity'

export const subcat_parkingLarsDebug: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum Debug',
  ui: 'checkbox',
  sourceId: 'lars_parking_debug',
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_parking_points,
          source,
          sourceLayer: 'processing.buffer_amenity_parking_points', // Separate Auto- und Fahrradflächen
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_parking_poly,
          source,
          sourceLayer: 'processing.buffer_amenity_parking_poly', // Separate Auto- und Fahrradflächen
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_driveways,
          source,
          sourceLayer: 'processing.buffer_driveways',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_kerb,
          source,
          sourceLayer: 'processing.buffer_kerb_intersections',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_crossings,
          source,
          sourceLayer: 'processing.buffer_pedestrian_crossings',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_bus_tram,
          source,
          sourceLayer: 'processing.buffer_pt_bus',
          idPrefix: 'bus',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_bus_tram,
          source,
          sourceLayer: 'processing.buffer_pt_tram',
          idPrefix: 'tram',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_debug_ramps,
          source,
          sourceLayer: 'processing.buffer_ramps',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_parking_obstacles,
          source,
          sourceLayer: 'processing.buffer_obstacle',
        }),
      ].flat(),
      legends: [
        {
          id: 'buffer_pt_bus__buffer_pt_tram',
          name: 'Bus- und Tramhaltestellen',
          style: {
            type: 'fill',
            color: 'rgba(250, 204, 20, 0.7)',
          },
        },
        {
          id: '1_buffer_amenity_parking_poly__buffer_amenity_parking_points',
          name: 'Separat erfasste Parkfläche',
          style: {
            type: 'fill',
            color: 'rgba(80, 139, 134, 0.7)',
          },
        },
        {
          id: '2_buffer_amenity_parking_poly__buffer_amenity_parking_points',
          name: 'Fahrradständer',
          style: {
            type: 'fill',
            color: 'rgba(80, 139, 134, 0.7)',
          },
        },
        {
          id: 'buffer_driveways',
          name: 'Einfahrten',
          style: {
            type: 'circle',
            color: 'rgba(8, 142, 175, 0.7)',
          },
        },
        {
          id: 'buffer_kerb_intersections',
          name: 'Bordsteinschnittpunkte',
          style: {
            type: 'circle',
            color: 'rgba(233, 89, 12, 0.7)',
          },
        },
        {
          id: 'buffer_pedestrian_crossings',
          name: 'Querungsstellen und Ampeln',
          style: {
            type: 'circle',
            color: 'rgba(33, 196, 93, 0.7)',
          },
        },
        {
          id: 'buffer_ramps',
          name: 'Transport&shy;überwege/Rampen',
          style: {
            type: 'circle',
            color: 'rgba(148, 163, 184, 0.7)',
          },
        },
        {
          id: 'parking_debug_obstacles',
          name: 'Laternen, Bäume, u.ä.',
          style: {
            type: 'circle',
            color: 'rgb(219, 39, 119)',
          },
        },
      ],
    },
  ],
}
