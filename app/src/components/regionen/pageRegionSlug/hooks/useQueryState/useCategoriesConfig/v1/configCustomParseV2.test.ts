import { describe, expect, test } from 'vitest'
import type { MapDataCategoryId } from '../../../../mapData/mapDataCategories/MapDataCategoryId'
import { createFreshCategoriesConfig } from '../createFreshCategoriesConfig'
import { configCustomParse } from './configCustomParse'

describe('config param parser v2', () => {
  const themes = [
    // The order here specifies the order in the UI
    'poi',
    'roads',
  ] satisfies MapDataCategoryId[]
  const freshConfig = createFreshCategoriesConfig(themes)

  describe('handle legacy v2 input', () => {
    test('A v2.1 migration of keys "topics"->"subcategories" and values like "fromTo"->"poi"', () => {
      // This migration was moved to getRegionRedirectUrl
    })

    test('A v2.2 (using "subcategories" ("sc")) input returns an updated config', () => {
      // Reminder: Since category/subcategory name migrations are done (and tested) in getRegionRedirectUrl we need to modify the input manually here
      // This is fine, because this part of the app will only ever receive the update values (the middleware runs first)

      const inputV22 =
        '!(i~poi~a~~sc~!(i~poi~s~!(i~hidden~a)(i~default~a~_F))(i~poiBoundaries~s~!(i~hidden~a)(i~default~a~_F)(i~level-8~a~_F)(i~level-9-10~a~_F))(i~poiPlusBarriers~s~!(i~default~a))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~bikelanes~a~~sc~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~verification~a~_F)(i~completeness~a~_F)(i~bikelane*_oneway*_arrows~a~_F))(i~signs~s~!(i~hidden~a)(i~default~a~_F))(i~bikelanesPresence~s~!(i~hidden~a)(i~default~a~_F)))(i~roads~a~_F~sc~!(i~roads~s~!(i~hidden~a~_F)(i~default~a)(i~oneway~a~_F)(i~road*_implicit*_shared*_lane~a~_F))(i~maxspeed~s~!(i~hidden~a)(i~default~a~_F)(i~details~a~_F)))(i~surface~a~_F~sc~!(i~roadsSurface~s~!(i~hidden~a~_F)(i~default~a)(i~bad~a~_F)(i~completeness~a~_F)(i~freshness~a~_F))(i~bikelanesSurface~s~!(i~hidden~a~_F)(i~default~a)(i~bad~a~_F)(i~completeness~a~_F)(i~freshness~a~_F)))(i~parking~a~_F~sc~!(i~parking~s~!(i~hidden~a~_F)(i~default~a)(i~presence~a~_F)(i~surface~a~_F))(i~parkingPoints~s~!(i~hidden~a)(i~default~a~_F))(i~parkingAreas~s~!(i~hidden~a~_F)(i~default~a)(i~street*_side~a~_F))(i~parkingDebug~s~!(i~hidden~a)(i~default~a~_F))(i~parkingStats~s~!(i~hidden~a)(i~stats-admin-level-4~a~_F)(i~default~a~_F)(i~stats-admin-level-10~a~_F)(i~length-admin-level-4~a~_F)(i~length-admin-level-9~a~_F)(i~length-admin-level-10~a~_F))(i~signs~s~!(i~hidden~a)(i~default~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~bicycleParking~a~_F~sc~!(i~bicycleParking~s~!(i~hidden~a~_F)(i~default~a)(i~witharea~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F))(i~publicTransport~s~!(i~hidden~a)(i~default~a~_F))(i~barriers~s~!(i~hidden~a~_F)(i~default~a))(i~boundaries~s~!(i~hidden~a~_F)(i~default~a)(i~level-8~a~_F)(i~level-9-10~a~_F)))~'
      const result = configCustomParse(inputV22, freshConfig)
      // console.log('result', JSON.stringify(result, undefined, 2))

      expect(result.length).toBe(2)
      expect(result?.[0]?.id).toBe('poi')
      expect(result?.[0]?.subcategories?.[1]?.id).toBe('poiPlaces')
      expect(result?.[0]?.subcategories?.[2]?.id).toBe('poiBoundaries')
      expect(result?.[0]?.subcategories?.[2]?.styles?.[0]?.active).toBeTruthy()
      // Note: Subcategory of type ui:checkbox do not have a "hidden" layer
      expect(result?.[0]?.subcategories?.[3]?.id).toBe('poiPlusBarriers')
      expect(result?.[0]?.subcategories?.[3]?.styles?.[0]?.active).toBeTruthy()
    })
  })
})
