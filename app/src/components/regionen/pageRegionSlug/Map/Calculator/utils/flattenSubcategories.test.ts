import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import { uniqueArray } from '@/components/shared/utils/uniqueArray'
import { flattenSubcategories } from './flattenSubcategories'

describe('flattenSubcategories()', () => {
  test('Flatten removes duplicate subcategories', () => {
    const initialMapConfig = createFreshCategoriesConfig(['bikelanes', 'surface'])

    // console.log('intialConfig', JSON.stringify(initialMapConfig, undefined, 2))
    const ids0 = initialMapConfig[0]?.subcategories?.map((t) => t.id) ?? []
    const ids1 = initialMapConfig[1]?.subcategories?.map((t) => t.id) ?? []
    const check = uniqueArray(ids0, ids1).length

    const result = flattenSubcategories(initialMapConfig)

    // console.log('result', JSON.stringify(result, undefined, 2))
    expect(result.length).toBe(check)
  })
})
