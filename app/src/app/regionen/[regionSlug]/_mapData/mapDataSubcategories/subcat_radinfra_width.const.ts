import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleGroupLayers_radinfra_width } from './mapboxStyles/groups/radinfra_width'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraWidthId = typeof subcatId
export type SubcatRadinfraWidthStyleIds = 'default'

export const bikelanesWidthLegend: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'below1m',
    name: '≤ 1,0 m',
    style: {
      type: 'line',
      color: '#ef9043',
    },
  },
  {
    id: '1to16m',
    name: '1,05–1.6 m',
    style: {
      type: 'line',
      color: '#f6de09',
    },
  },
  {
    id: '165-24m',
    name: '1,65–2.4 m',
    style: {
      type: 'line',
      color: '#a1e217',
    },
  },
  {
    id: 'above24',
    name: '> 2.4 m',
    style: {
      type: 'line',
      color: '#15c65c',
    },
  },
  {
    id: 'missing',
    name: 'Breite fehlt',
    style: {
      type: 'line',
      color: '#fda5e4',
      dasharray: [3, 2],
      width: 2,
    },
  },
]

export const subcat_radinfra_width: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Breite',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'RVA Breite', // field hidden
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_radinfra_width,
        source,
        sourceLayer,
      }),
      legends: bikelanesWidthLegend,
    },
  ],
}
