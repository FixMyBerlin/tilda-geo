import { FileMapDataSubcategory } from '../types'

const subcatId = 'mapillaryPlus'
export type SubcatRadinfraPlusMapillaryId = typeof subcatId
export type SubcatRadinfraPlusMapillaryStyleIds = 'default'

export const subcat_radinfraPlusMapillary: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Verfügbarkeit hervorheben',
  ui: 'checkbox',
  sourceId: 'mapillary_coverage',
  beforeId: 'atlas-app-beforeid-below-roadname',
  styles: [
    {
      id: 'default',
      name: 'Verfügbarkeit hervorheben',
      legends: [
        {
          id: 'highlight-cam',
          name: 'Aktuelle, klassische Fotos',
          style: {
            type: 'border',
            color: 'green',
          },
        },
        {
          id: 'highlight-360',
          name: 'Aktuelle 360° Fotos',
          style: {
            type: 'border',
            color: 'blue',
          },
        },
      ],
      layers: [
        {
          id: 'plus_highlight_mapillary',
          interactive: false, // Interaction DISABLED
          type: 'line',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            // Sort pano on top of non-pano pictures
            'line-sort-key': ['case', ['==', ['get', 'is_pano'], true], 300, 100],
          },
          source: 'mapillary-source',
          'source-layer': 'sequence',
          paint: {
            'line-color': ['case', ['==', ['get', 'is_pano'], true], 'blue', 'green'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 10, 20, 28],
            // 'line-opacity': 0.25,
            // 'line-offset': 10,
          },
          filter: [
            '>',
            ['get', 'captured_at'],
            new Date().setFullYear(new Date().getFullYear() - 3),
          ],
        },
        {
          id: 'plus_highlight_mapillary-fill',
          interactive: false, // Interaction DISABLED
          type: 'line',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            // Sort pano on top of non-pano pictures
            'line-sort-key': ['case', ['==', ['get', 'is_pano'], true], 300, 100],
          },
          source: 'mapillary-source',
          'source-layer': 'sequence',
          paint: {
            'line-color': 'white',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 8, 20, 26],
            'line-opacity': 0.95,
            // 'line-offset': 10,
          },
          filter: [
            '>',
            ['get', 'captured_at'],
            new Date().setFullYear(new Date().getFullYear() - 3),
          ],
        },
      ],
    },
  ],
}
