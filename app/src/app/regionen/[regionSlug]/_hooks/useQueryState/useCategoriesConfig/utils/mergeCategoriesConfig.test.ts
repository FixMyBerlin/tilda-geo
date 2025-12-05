import { describe, expect, test } from 'vitest'
import { SourcesId } from '../../../../_mapData/mapDataSources/sources.const'
import { FileMapDataSubcategoryStyleLayer } from '../../../../_mapData/types'
import { MapDataCategoryConfig } from '../type'
import { mergeCategoriesConfig } from './mergeCategoriesConfig'

describe('mergeCategoriesConfig()', () => {
  const defaultSubcategoryObject = {
    name: 'Foo',
    sourceId: 'atlas_bikelanes' as SourcesId,
    defaultStyle: 'default' as const,
    ui: 'dropdown' as const,
  }
  const defaultStyleObject = {
    name: 'Name',
    desc: null,
    layers: [
      {
        type: 'fill',
        'source-layer': 'sourLayerName',
      } as FileMapDataSubcategoryStyleLayer,
    ],
    legends: null,
  }
  const freshConfig = [
    {
      id: 'surface',
      name: 'Foo',
      active: true,
      subcategories: [
        {
          id: 'surfaceRoads',
          ...defaultSubcategoryObject,
          styles: [
            { ...defaultStyleObject, id: 'default', active: true }, // change to false
            { ...defaultStyleObject, id: 'completeness', active: false }, // change to true
            { ...defaultStyleObject, id: 'freshness', active: false },
          ],
        },
        {
          id: 'poiPlaces',
          ...defaultSubcategoryObject,
          styles: [
            { ...defaultStyleObject, id: 'default', active: true },
            { ...defaultStyleObject, id: 'circle', active: false },
          ],
        },
        {
          id: 'poiPlusLanduse',
          ...defaultSubcategoryObject,
          styles: [{ ...defaultStyleObject, id: 'default', active: true }], // change id to name_changed
        },
      ],
    },
    {
      id: 'poi',
      name: 'Foo',
      active: false,
      subcategories: [
        {
          id: 'poiBoundaries',
          ...defaultSubcategoryObject,
          styles: [{ ...defaultStyleObject, id: 'default', active: true }],
        },
      ],
    },
    {
      id: 'bikelanes',
      name: 'Foo',
      active: false,
      subcategories: [
        {
          id: 'bikelanes',
          ...defaultSubcategoryObject,
          styles: [{ ...defaultStyleObject, id: 'default', active: true }],
        },
      ],
    },
  ] satisfies MapDataCategoryConfig[]

  test('If nothing changed, nothing is done', () => {
    const result = mergeCategoriesConfig({
      freshConfig,
      urlConfig: freshConfig,
    })

    expect(result).toMatchObject(freshConfig)
  })

  test('`active` states are re-applied (if `id` stayed the same)', () => {
    const urlConfig = structuredClone(freshConfig)
    urlConfig[0]!.subcategories[0]!.styles[0]!.active = false // subcategory:surfaceRoads style-id:default
    urlConfig[0]!.subcategories[0]!.styles[1]!.active = true // subcategory:surfaceRoads style-id:completenes

    const result = mergeCategoriesConfig({
      freshConfig,
      urlConfig,
    })

    // console.log('result', JSON.stringify(result, undefined, 2))
    // console.log('urlConfig', JSON.stringify(urlConfig, undefined, 2))
    // console.log('freshConfig', JSON.stringify(freshConfig, undefined, 2))
    expect(result).toMatchObject(urlConfig)
  })

  test('New config entries are added (with default active state); UseCase url config is missing options that where added later', () => {
    const urlConfig = structuredClone(freshConfig)
    delete urlConfig[0]!.subcategories[1] // subcategory:surfaceRoads subcategory:landuse style removed
    delete urlConfig[0]!.subcategories[2]!.styles[1] // subcategory:surfaceRoads subcategory:landuse style removed
    delete urlConfig[2] // subcategory:bikelanes

    const result = mergeCategoriesConfig({
      freshConfig,
      urlConfig,
    })

    // console.log('result', JSON.stringify(result, undefined, 2))
    // console.log('urlConfig', JSON.stringify(urlConfig, undefined, 2))
    // console.log('freshConfig', JSON.stringify(freshConfig, undefined, 2))
    expect(result).toMatchObject(freshConfig)
  })

  test('Deleted/old config entries are ignored; UseCase url config holds old entries that where removed now.', () => {
    const urlConfig = structuredClone(freshConfig)
    // @ts-expect-error the object structure is checked manually
    urlConfig[0].subcategories[2].styles[0].id = 'now_removed_style' // subcategory:surfaceRoads subcategory:landuse style:id changed

    const result = mergeCategoriesConfig({
      freshConfig,
      urlConfig,
    })

    // console.log('result', JSON.stringify(result, undefined, 2))
    // console.log('urlConfig', JSON.stringify(urlConfig, undefined, 2))
    // console.log('freshConfig', JSON.stringify(freshConfig, undefined, 2))
    expect(result).toMatchObject(freshConfig)
  })

  test('Renamed category IDs are ignored and fall back to defaults', () => {
    // This test documents the PROBLEM: what happens WITHOUT migration.
    // When a category ID in urlConfig doesn't match any category in freshConfig,
    // mergeCategoriesConfig ignores it and uses freshConfig defaults.
    // This is why we need migrateConfigCategoryIds() in middleware.ts to map old IDs to new ones
    // before calling mergeCategoriesConfig (e.g., 'parking' -> 'parkingLars').
    // See middleware.test.ts "MIGRATION: Migrate old parking category to parkingLars" for the SOLUTION.
    const freshConfigWithParkingLars: MapDataCategoryConfig[] = [
      {
        id: 'parkingLars',
        name: 'Parkraum',
        desc: 'Parkraum',
        active: false,
        subcategories: [
          {
            id: 'parkingLars',
            ...defaultSubcategoryObject,
            styles: [
              { ...defaultStyleObject, id: 'default', active: true },
              { ...defaultStyleObject, id: 'presence', active: false },
            ],
          },
        ],
      },
    ]

    // Old config with category ID 'parking' (renamed to 'parkingLars')
    const urlConfigWithOldParking = [
      {
        id: 'parking', // Old ID that was renamed
        active: true, // User had this active
        subcategories: [
          {
            id: 'parking', // Old subcategory ID
            styles: [
              { id: 'default', active: false }, // User had this disabled
              { id: 'presence', active: true }, // User had this enabled
            ],
          },
        ],
      },
    ]

    const result = mergeCategoriesConfig({
      freshConfig: freshConfigWithParkingLars,
      // @ts-expect-error the old config will error
      urlConfig: urlConfigWithOldParking,
    })

    // WITHOUT migration: The old 'parking' category is ignored because it doesn't match 'parkingLars'
    // So we get the fresh config defaults instead of the user's settings
    // This demonstrates why migrateConfigCategoryIds() is needed in the middleware.
    expect(result[0]?.id).toBe('parkingLars')
    expect(result[0]?.active).toBe(false) // Default, not the user's 'true'
    expect(result[0]?.subcategories[0]?.styles[0]?.active).toBe(true) // Default, not the user's 'false'
    expect(result[0]?.subcategories[0]?.styles[1]?.active).toBe(false) // Default, not the user's 'true'
  })
})
