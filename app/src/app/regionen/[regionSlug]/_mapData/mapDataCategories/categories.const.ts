import { subcat_accidents } from '../mapDataSubcategories/subcat_accidents.const'
import { subcat_bicycleParking } from '../mapDataSubcategories/subcat_bicycleParking'
import { subcat_bikelanes } from '../mapDataSubcategories/subcat_bikelanes.const'
import { subcat_bikelanesStatistics } from '../mapDataSubcategories/subcat_bikelanesStatistics.const'
import { subcat_bikelanes_plus_bikesuitability } from '../mapDataSubcategories/subcat_bikelanes_plus_bikeSuitability'
import { subcat_bikelanes_plus_presence } from '../mapDataSubcategories/subcat_bikelanes_plus_presence.const'
import { subcat_bikelanes_plus_routes } from '../mapDataSubcategories/subcat_bikelanes_plus_routes.const'
import { subcat_bikelanes_plus_signs } from '../mapDataSubcategories/subcat_bikelanes_plus_signs.const'
import { subcat_bikelanes_plus_surface_text } from '../mapDataSubcategories/subcat_bikelanes_plus_surface_text.const'
import { subcat_bikelanes_plus_width_text } from '../mapDataSubcategories/subcat_bikelanes_plus_width_text.const'
import { subcat_lit } from '../mapDataSubcategories/subcat_lit.const'
import { subcat_lit_plus_completeness } from '../mapDataSubcategories/subcat_lit_plus_completeness.const'
import { subcat_mapillaryCoverage } from '../mapDataSubcategories/subcat_mapillaryCoverage.const'
import { subcat_maxspeed } from '../mapDataSubcategories/subcat_maxspeed.const'
import { subcat_parkingLars } from '../mapDataSubcategories/subcat_parkingLars.const'
import { subcat_parkingLarsAreas } from '../mapDataSubcategories/subcat_parkingLarsAreas.const'
import { subcat_parkingLarsBoundaries } from '../mapDataSubcategories/subcat_parkingLarsBoundaries.const'
import { subcat_parkingLarsDebug } from '../mapDataSubcategories/subcat_parkingLarsDebug.const'
import { subcat_parkingLarsPoints } from '../mapDataSubcategories/subcat_parkingLarsPoints.const'
import { subcat_parkingLarsStats } from '../mapDataSubcategories/subcat_parkingLarsStats.const'
import { subcat_poi } from '../mapDataSubcategories/subcat_poi.const'
import { subcat_poi_boundaries } from '../mapDataSubcategories/subcat_poi_boundaries.const'
import { subcat_poi_places } from '../mapDataSubcategories/subcat_poi_places.const'
import { subcat_poi_plus_barriers } from '../mapDataSubcategories/subcat_poi_plus_barriers.const'
import { subcat_poi_plus_landuse } from '../mapDataSubcategories/subcat_poi_plus_landuse.const'
import { subcat_poi_plus_publicTransport } from '../mapDataSubcategories/subcat_poi_plus_publicTransport.const'
import { subcat_roads } from '../mapDataSubcategories/subcat_roads.const'
import { subcat_roads_plus_footways } from '../mapDataSubcategories/subcat_roads_plus_footways.const'
import { subcat_roads_plus_label } from '../mapDataSubcategories/subcat_roads_plus_label.const'
import { subcat_roads_plus_oneway } from '../mapDataSubcategories/subcat_roads_plus_oneway.const'
import { subcat_signs } from '../mapDataSubcategories/subcat_signs.const'
import { subcat_surface_bikelane } from '../mapDataSubcategories/subcat_surface_bikelane'
import { subcat_surface_roads } from '../mapDataSubcategories/subcat_surface_roads.const'
import { StaticMapDataCategory } from '../types'
import { categoriesParkingLars } from './categoriesParkingLars.const'
import { categoriesParkingTilda } from './categoriesParkingTilda.const'
import { categoriesRadinfra } from './categoriesRadinfra.const'

export const categories: StaticMapDataCategory[] = [
  {
    // Figma https://www.figma.com/file/N9LROlksQn4tGHZp0k0KeS/OSM-Atlas?type=design&node-id=1062-9375&mode=design&t=k2PHofwptElXro3a-0
    id: 'poi',
    name: 'Orte, Ziele, Grenzen',
    desc: 'Siedlungszentren, Zielorte, Barrieren',
    subcategories: [
      { ...subcat_poi, defaultStyle: 'default' },
      { ...subcat_poi_places, defaultStyle: 'default' },
      { ...subcat_poi_boundaries, defaultStyle: 'hidden' },
      { ...subcat_poi_plus_barriers, defaultStyle: 'hidden' },
      { ...subcat_poi_plus_landuse, defaultStyle: 'hidden' },
      { ...subcat_poi_plus_publicTransport, defaultStyle: 'hidden' },
    ],
  },
  {
    // Only used ONCE for now for the 'bb-kampagne'-region
    id: 'boundaries',
    name: 'Grenzen',
    desc: 'Siedlungszentren und Barrieren',
    subcategories: [
      { ...subcat_poi_places, defaultStyle: 'hidden' },
      { ...subcat_poi_boundaries, defaultStyle: 'default' },
      { ...subcat_poi_plus_barriers, defaultStyle: 'hidden' },
    ],
  },
  {
    // Figma https://www.figma.com/file/N9LROlksQn4tGHZp0k0KeS/OSM-Atlas?type=design&node-id=1062-9397&mode=design&t=k2PHofwptElXro3a-0
    id: 'roads',
    name: 'Straßentypen',
    desc: 'Straßenklassen, Tempolimits',
    subcategories: [
      { ...subcat_roads, defaultStyle: 'default' },
      { ...subcat_maxspeed, defaultStyle: 'hidden' },
      { ...subcat_roads_plus_oneway, defaultStyle: 'hidden' },
      { ...subcat_roads_plus_footways, defaultStyle: 'hidden' },
      { ...subcat_roads_plus_label, defaultStyle: 'default' },
      // { id: 'subcat_roads_plus_lanes_text', defaultStyle: 'hidden' },
      // { id: 'subcat_roads_plus_surface_text', defaultStyle: 'hidden' },
      // { ...subcat_maxspeed_plus_presence, defaultStyle: 'hidden' }, // TEMP deactivated, see https://github.com/FixMyBerlin/private-issues/issues/594#issuecomment-1969083526
    ],
  },
  {
    // Figma https://www.figma.com/file/N9LROlksQn4tGHZp0k0KeS/OSM-Atlas?type=design&node-id=1062-9386&mode=design&t=sIuuLD4vxJJzKOWr-0
    id: 'bikelanes',
    name: 'Radinfrastruktur',
    desc: 'Führungsform, Breite, RVA-Oberfläche',
    subcategories: [
      { ...subcat_bikelanes, defaultStyle: 'default' },
      { ...subcat_bikelanes_plus_presence, defaultStyle: 'hidden' },
      // Plus
      { ...subcat_bikelanes_plus_width_text, defaultStyle: 'hidden' },
      { ...subcat_bikelanes_plus_surface_text, defaultStyle: 'hidden' },
      // { id: 'bikelanesOneway', defaultStyle: 'default' },
      { ...subcat_bikelanes_plus_signs, defaultStyle: 'hidden' },
      { ...subcat_bikelanes_plus_routes, defaultStyle: 'hidden' },
      { ...subcat_bikelanes_plus_bikesuitability, defaultStyle: 'hidden' },
      // LATER
      // { id: 'bikelanesProtection', defaultStyle: 'hidden' },
      // { id: 'tram', defaultStyle: 'hidden' },
    ],
  },
  {
    id: 'bikelanes-minimal',
    name: 'Radinfrastruktur',
    desc: 'Führungsform RVA',
    subcategories: [{ ...subcat_bikelanes, defaultStyle: 'default' }],
  },
  {
    id: 'lit',
    name: 'Beleuchtung',
    desc: 'Fahrbahn & Radinfrastruktur',
    subcategories: [
      { ...subcat_lit, defaultStyle: 'default' },
      { ...subcat_lit_plus_completeness, defaultStyle: 'hidden' },
    ],
  },
  {
    // Figma https://www.figma.com/file/N9LROlksQn4tGHZp0k0KeS/OSM-Atlas?type=design&node-id=1062-9408&mode=design&t=k2PHofwptElXro3a-0
    id: 'surface',
    name: 'Oberflächen',
    desc: 'Fahrbahn & Radinfrastruktur',
    subcategories: [
      { ...subcat_surface_roads, defaultStyle: 'default' },
      { ...subcat_surface_bikelane, defaultStyle: 'hidden' },
    ],
  },
  {
    id: 'parkingLars',
    name: 'Parkraum (Community)',
    desc: 'Parken im Straßenraum – Community-Prozessierung',
    subcategories: [
      { ...subcat_parkingLars, defaultStyle: 'default' },
      { ...subcat_parkingLarsPoints, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsAreas, defaultStyle: 'default' },
      { ...subcat_parkingLarsDebug, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsStats, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsBoundaries, defaultStyle: 'hidden' },
      { ...subcat_signs, defaultStyle: 'hidden' },
      // { id: 'mapillaryCoverage', defaultStyle: "hidden" },
      // { id: 'accidents', defaultStyle: "hidden" },
    ],
  },
  {
    id: 'bicycleParking',
    name: 'Fahrradstellplätze (Beta)',
    desc: '',
    subcategories: [{ ...subcat_bicycleParking, defaultStyle: 'default' }],
  },
  {
    id: 'statistics',
    name: 'Statistik',
    desc: '',
    subcategories: [
      { ...subcat_bikelanesStatistics, defaultStyle: 'default' },
      { ...subcat_poi_boundaries, defaultStyle: 'default' },
    ],
  },
  {
    id: 'mapillary',
    name: 'Mapillary',
    desc: 'Straßenfotos',
    subcategories: [{ ...subcat_mapillaryCoverage, defaultStyle: 'default' }],
  },
  {
    id: 'accidents',
    name: 'Unfallatlas',
    desc: 'Unfalldaten',
    subcategories: [{ ...subcat_accidents, defaultStyle: 'default' }],
  },
  ...categoriesRadinfra,
  ...categoriesParkingTilda,
  ...categoriesParkingLars,
]
