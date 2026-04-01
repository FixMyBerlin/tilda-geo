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
