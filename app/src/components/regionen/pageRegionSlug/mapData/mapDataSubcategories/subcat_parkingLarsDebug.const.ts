import type { FileMapDataSubcategory } from '../types'
import { layers_parkingLars_debug_bus_tram } from './layers/parkingLars_debug_bus_tram'
import { layers_parkingLars_debug_crossings } from './layers/parkingLars_debug_crossings'
import { layers_parkingLars_debug_driveways } from './layers/parkingLars_debug_driveways'
import { layers_parkingLars_debug_kerb } from './layers/parkingLars_debug_kerb'
import { layers_parkingLars_debug_parking_points } from './layers/parkingLars_debug_parking_points'
import { layers_parkingLars_debug_parking_poly } from './layers/parkingLars_debug_parking_poly'
import { layers_parkingLars_debug_ramps } from './layers/parkingLars_debug_ramps'
import { layers_parkingLars_obstacles } from './layers/parkingLars_obstacles'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
        wrapSourceLayers({
          layers: layers_parkingLars_debug_parking_points,
          source,
          sourceLayer: 'processing.buffer_amenity_parking_points', // Separate Auto- und Fahrradflächen
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_parking_poly,
          source,
          sourceLayer: 'processing.buffer_amenity_parking_poly', // Separate Auto- und Fahrradflächen
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_driveways,
          source,
          sourceLayer: 'processing.buffer_driveways',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_kerb,
          source,
          sourceLayer: 'processing.buffer_kerb_intersections',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_crossings,
          source,
          sourceLayer: 'processing.buffer_pedestrian_crossings',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_bus_tram,
          source,
          sourceLayer: 'processing.buffer_pt_bus',
          idPrefix: 'bus',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_bus_tram,
          source,
          sourceLayer: 'processing.buffer_pt_tram',
          idPrefix: 'tram',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_debug_ramps,
          source,
          sourceLayer: 'processing.buffer_ramps',
        }),
        wrapSourceLayers({
          layers: layers_parkingLars_obstacles,
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
