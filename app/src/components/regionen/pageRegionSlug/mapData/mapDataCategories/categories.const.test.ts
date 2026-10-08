import { describe, expect, test } from 'vitest'
import { categories } from './categories.const'

describe('categories', () => {
  test('every category id is defined only once', () => {
    const ids = categories.map((category) => category.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    expect(duplicates).toEqual([])
  })
})
