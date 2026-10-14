import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_boundaries } from './layers/boundaries'
import { mapboxStyleGroupLayers_atlas_boundaries_names } from './layers/boundaries_names'
import { mapboxStyleLayers } from './layers/utils/mapboxStyleLayers'

const topiId = 'poiBoundaries'
export type SubcatPoiBoundariesId = typeof topiId
export type SubcatPoiBoundariesStyleIds =
  | 'default'
  | 'category_district_label'
  | 'category_municipality'
  | 'category_municipality_label'

export const subcat_poi_boundaries: FileMapDataSubcategory = {
  id: topiId,
  name: 'Verwaltungsbereiche',
  ui: 'dropdown',
  sourceId: 'atlas_boundaries',
  beforeId: 'boundary_country',
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Landkreise & Kreisfreie Städte',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaries',
          additionalFilter: ['has', 'category_district'],
        }),
      ],
    },
    {
      id: 'category_district_label',
      name: 'Landkreise & Kreisfreie Städte mit Namen',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaries',
          additionalFilter: ['has', 'category_district'],
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries_names,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaryLabels',
          additionalFilter: ['has', 'category_district'],
        }),
      ],
    },
    {
      id: 'category_municipality',
      name: 'Gemeinden',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaries',
          additionalFilter: ['has', 'category_municipality'],
        }),
      ],
    },
    {
      id: 'category_municipality_label',
      name: 'Gemeinden mit Namen',
      layers: [
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaries',
          additionalFilter: ['has', 'category_municipality'],
        }),
        ...mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_boundaries_names,
          source: 'atlas_boundaries',
          sourceLayer: 'boundaryLabels',
          additionalFilter: ['has', 'category_municipality'],
        }),
      ],
    },
  ],
}
