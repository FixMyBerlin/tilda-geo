import { subcat_bikelanes_plus_routes } from '../mapDataSubcategories/subcat_bikelanes_plus_routes.const'
import { subcat_bikelanes_plus_surface_text } from '../mapDataSubcategories/subcat_bikelanes_plus_surface_text.const'
import { subcat_bikelanes_plus_width_text } from '../mapDataSubcategories/subcat_bikelanes_plus_width_text.const'
import { subcat_mapillaryCoverage } from '../mapDataSubcategories/subcat_mapillaryCoverage.const'
import { subcat_radinfra_bikelanes } from '../mapDataSubcategories/subcat_radinfra_bikelanes.const'
import { subcat_radinfra_campaigns } from '../mapDataSubcategories/subcat_radinfra_campaigns.const'
import { subcat_radinfra_currentness } from '../mapDataSubcategories/subcat_radinfra_currentness.const'
import { subcat_radinfra_oneway } from '../mapDataSubcategories/subcat_radinfra_oneway.const'
import { subcat_radinfraPlusMapillary } from '../mapDataSubcategories/subcat_radinfra_plus_mapillary.const'
import { subcat_radinfra_smoothness } from '../mapDataSubcategories/subcat_radinfra_smoothness.const'
import { subcat_radinfra_stats } from '../mapDataSubcategories/subcat_radinfra_stats'
import { subcat_radinfra_trafficSigns } from '../mapDataSubcategories/subcat_radinfra_trafficSigns.const'
import { subcat_radinfra_width } from '../mapDataSubcategories/subcat_radinfra_width.const'
import { StaticMapDataCategory } from '../types'

export const categoriesRadinfra: StaticMapDataCategory[] = [
  {
    id: 'radinfra_bikelanes',
    name: 'Radinfrastruktur',
    desc: 'Führungsform, Breite, RVA-Oberfläche',
    subcategories: [
      { ...subcat_radinfra_bikelanes, defaultStyle: 'default' },
      // // { id: 'bikelanesOneway', defaultStyle: 'default' },
      { ...subcat_bikelanes_plus_routes, defaultStyle: 'hidden' },
      // { ...subcat_bikelanes_plus_bikesuitability, defaultStyle: 'hidden' },
    ],
  },
  {
    id: 'radinfra_surface',
    name: 'Oberflächenqualität',
    desc: 'Material und Qualität des Belages',
    subcategories: [
      { ...subcat_radinfra_smoothness, defaultStyle: 'default' },
      {
        ...subcat_bikelanes_plus_surface_text,
        defaultStyle: 'hidden',
      },
    ],
  },
  {
    id: 'radinfra_width',
    name: 'Breite',
    desc: 'Breite der Infrastruktur',
    subcategories: [
      { ...subcat_radinfra_width, defaultStyle: 'default' },
      {
        ...subcat_bikelanes_plus_width_text,
        defaultStyle: 'hidden',
      },
    ],
  },
  {
    id: 'radinfra_oneway',
    name: 'Verkehrsrichtung',
    desc: 'Einbahnstraße oder beidseitig befahrbar?',
    subcategories: [{ ...subcat_radinfra_oneway, defaultStyle: 'default' }],
  },
  {
    id: 'radinfra_trafficSigns',
    name: 'Verkehrszeichen',
    desc: 'Ausschilderung der Infrastruktur',
    subcategories: [{ ...subcat_radinfra_trafficSigns, defaultStyle: 'default' }],
  },
  {
    id: 'radinfra_currentness',
    name: 'Aktualität',
    desc: 'Was lange nicht geprüft wurde…',
    subcategories: [{ ...subcat_radinfra_currentness, defaultStyle: 'default' }],
  },
  {
    id: 'radinfra_campagins',
    name: 'Kampagnen',
    desc: 'Hier gibt es etwas zu tun…',
    subcategories: [{ ...subcat_radinfra_campaigns, defaultStyle: 'default' }],
  },
  {
    id: 'radinfra_statistics',
    name: 'Statistik',
    desc: 'Regionale Auswertung',
    subcategories: [
      { ...subcat_radinfra_stats, defaultStyle: 'default' },
      // { ...subcat_poi_boundaries, defaultStyle: 'default' },
    ],
  },
  {
    id: 'radinfra_mapillary',
    name: 'Mapillary',
    desc: 'Straßenlevel Fotos',
    subcategories: [
      { ...subcat_mapillaryCoverage, defaultStyle: 'default' },
      { ...subcat_radinfraPlusMapillary, defaultStyle: 'default' },
    ],
  },
]
