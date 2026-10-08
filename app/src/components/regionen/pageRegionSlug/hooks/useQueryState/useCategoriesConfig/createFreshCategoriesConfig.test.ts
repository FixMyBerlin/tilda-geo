import { describe, expect, test } from 'vitest'
import { createFreshCategoriesConfig } from './createFreshCategoriesConfig'

describe('createFreshCategoriesConfig()', () => {
  test('Create an initial config object and take the make the defaultStyle active', () => {
    const result = createFreshCategoriesConfig(['poi'])

    expect(result[0]?.id).toBe('poi')
    expect(result[0]?.subcategories?.[0]?.id).toBe('poi')

    const firstStyle = result[0]?.subcategories?.[0]?.styles?.[0]
    expect(firstStyle?.id).toBe('hidden')
    expect(typeof firstStyle?.active).toBe('boolean')
    expect(firstStyle?.active).toBeFalsy()

    const secondStyle = result[0]?.subcategories?.[0]?.styles?.[1]
    expect(secondStyle?.id).toBe('default')
    expect(typeof secondStyle?.active).toBe('boolean')
    expect(secondStyle?.active).toBeTruthy()
  })
})

describe('Surface and lighting show the same data groups with the same defaults', () => {
  const [lit, surface] = createFreshCategoriesConfig(['lit', 'surface'])
  const activeStyleIds = (category: typeof lit) =>
    category?.subcategories.map(
      (subcat) => subcat.styles.find((style) => style.active)?.id ?? 'hidden',
    )

  test('Same names in the same order', () => {
    expect(surface?.subcategories.map((subcat) => subcat.name)).toEqual(
      lit?.subcategories.map((subcat) => subcat.name),
    )
  })

  test('Same sources in the same order', () => {
    expect(surface?.subcategories.map((subcat) => subcat.sourceId)).toEqual(
      lit?.subcategories.map((subcat) => subcat.sourceId),
    )
  })

  test('Roads and bikelanes are on, path classes and highway areas are off', () => {
    const expected = ['default', 'default', 'hidden', 'hidden']
    expect(activeStyleIds(lit)).toEqual(expected)
    expect(activeStyleIds(surface)).toEqual(expected)
  })
})
