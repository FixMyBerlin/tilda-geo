import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'

// Data https://studio.mapbox.com/tilesets/hejco.86v96gzk/#17.29/52.564196/13.327916
// Style https://studio.mapbox.com/styles/hejco/cl6upu3zo000015o3im4kug1n/edit/#17.29/52.564196/13.327916

// TODO: Did use the default public token from https://account.mapbox.com/

const subcatId = 'accidents'
const source = 'accidents_unfallatlas'
export type SubcatAccidentsId = typeof subcatId
export type SubcatAccidentsStyleIds = 'default'

// Zu den Daten: https://studio.mapbox.com/tilesets/hejco.5oexnrgf/
export const subcat_accidents: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Unfälle',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: [
        {
          id: 'circle',
          type: 'circle',
          source,
          'source-layer': 'unfaelle_mit_personschaden-4zh9z7',
          filter: ['all', ['match', ['get', 'Unfallkate'], ['1', '2', '3'], true, false]],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 1, 19, 4, 20, 10],
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 15.5, 0, 17, 0.8],
            'circle-stroke-color': [
              'match',
              ['get', 'Unfallkate'],
              ['1'],
              'hsl(325, 91%, 43%)',
              ['2'],
              'hsl(0, 74%, 43%)',
              ['3'],
              'hsl(22, 85%, 60%)',
              'hsl(0, 0%, 100%)',
            ],
            'circle-color': [
              'match',
              ['get', 'Unfalltyp'],
              ['2'],
              'hsl(60, 98%, 66%)',
              ['3'],
              'hsl(0, 100%, 52%)',
              ['1'],
              'hsl(152, 79%, 30%)',
              ['5'],
              'hsl(203, 100%, 43%)',
              ['6'],
              'hsl(38, 94%, 56%)',
              ['7'],
              '#3f4948',
              'hsl(0, 0%, 100%)',
            ],
            'circle-stroke-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              18,
              ['match', ['get', 'Unfallkate'], ['2', '1'], 2.5, 2],
              20,
              ['match', ['get', 'Unfallkate'], ['1', '2'], 7, 5],
            ],
            'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 15.5, 0, 17, 1],
          },
        },
        {
          id: 'label',
          type: 'symbol',
          source,
          'source-layer': 'unfaelle_mit_personschaden-4zh9z7',
          filter: ['all', ['match', ['get', 'Unfallkate'], ['1', '2', '3'], true, false]],
          layout: {
            'text-field': ['to-string', ['get', 'UJAHR']],
            'text-size': ['interpolate', ['linear'], ['zoom'], 16, 8, 18, 12, 20, 20],
            'text-anchor': 'bottom',
            'text-offset': [0, -0.6],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-letter-spacing': 0.01,
          },
          paint: {
            'text-color': [
              'match',
              ['get', 'Unfallkate'],
              ['1'],
              '#d10a7e',
              ['2'],
              '#bf1d1d',
              'hsl(0, 0%, 51%)',
            ],
            'text-halo-color': 'hsl(51, 5%, 100%)',
            'text-halo-blur': 0.5,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 17, 0, 17.3, 1],
            'text-halo-width': 1,
          },
        },
      ],
      // Style https://studio.mapbox.com/styles/hejco/ckdzvkywj0u3g1amidtrbnw5v/edit/#18.84/52.4900339/13.3864461
      // Data https://studio.mapbox.com/tilesets/hejco.5oexnrgf/#16.88/52.497576/13.431483
      // TODO: We can migrate those filters into styles by adding filters to the style. However, we can do this later…
      // interactiveFilters: [
      //   {
      //     id: 'category',
      //     name: 'Unfallkategorie',
      //     filterConfig: { lookupKey: 'Unfallkate' },
      //     inputType: 'checkbox',
      //     options: [
      //       { id: '1', name: 'Unfälle mit Getöteten', defaultActive: true },
      //       {
      //         id: '2',
      //         name: 'Unfälle mit Schwerverletzten',
      //         defaultActive: true,
      //       },
      //       {
      //         id: '3',
      //         name: 'Unfälle mit Leichtverletzten',
      //         defaultActive: true,
      //       },
      //     ],
      //   },
      //   {
      //     id: 'type',
      //     name: 'Unfalltyp',
      //     filterConfig: { lookupKey: 'Unfalltyp' },
      //     inputType: 'checkbox',
      //     options: [
      //       { id: '1', name: 'Fahrunfall', defaultActive: true },
      //       { id: '2', name: 'Abbiege-Unfall', defaultActive: true },
      //       {
      //         id: '3',
      //         name: 'Einbiegen / Kreuzen-Unfall',
      //         defaultActive: true,
      //       },
      //       { id: '4', name: 'Überschreitenunfall', defaultActive: true },
      //       {
      //         id: '5',
      //         name: 'Unfall durch ruhenden Verkehr',
      //         defaultActive: true,
      //       },
      //       { id: '6', name: 'Unfall im Längsverkehr', defaultActive: true },
      //       { id: '7', name: 'Sonstiger Unfall', defaultActive: true },
      //     ],
      //   },
      //   {
      //     id: 'years',
      //     name: 'Jahre',
      //     filterConfig: { lookupKey: 'UJAHR' },
      //     inputType: 'checkbox',
      //     options: [
      //       { id: '2017', name: '2017' },
      //       { id: '2018', name: '2018', defaultActive: true },
      //       { id: '2019', name: '2019', defaultActive: true },
      //     ],
      //   },
      // ],
    },
  ],
}
