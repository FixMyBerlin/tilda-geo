import { describe, expect, test } from 'vitest'
import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { migrateOldLitCategory } from './migrateLitCompletenessConfig.server'

const litCategory = (active: boolean, subcategories: MapDataCategoryParam['subcategories']) =>
  ({
    id: 'lit',
    active,
    subcategories,
  }) satisfies MapDataCategoryParam

describe('migrateOldLitCategory', () => {
  test('old dropdown styles activate the category and drop subcategory state', () => {
    const result = migrateOldLitCategory(
      litCategory(false, [
        {
          id: 'lit',
          styles: [
            { id: 'hidden', active: true },
            { id: 'default', active: false },
            { id: 'lit', active: false },
          ],
        },
      ]),
    )

    expect(result.active).toBe(true)
    expect(result.subcategories).toEqual([])
  })

  test('old lit-completeness checkbox is ignored and treated as old config', () => {
    const result = migrateOldLitCategory(
      litCategory(false, [
        {
          id: 'lit',
          styles: [
            { id: 'hidden', active: true },
            { id: 'default', active: false },
            { id: 'lit', active: false },
          ],
        },
        { id: 'lit-completeness', styles: [{ id: 'completeness', active: true }] },
      ]),
    )

    expect(result.active).toBe(true)
    expect(result.subcategories).toEqual([])
  })

  test('current checkbox-only config is left unchanged', () => {
    const current = litCategory(false, [
      { id: 'lit', styles: [{ id: 'default', active: false }] },
      { id: 'lit_bikelanes', styles: [{ id: 'default', active: true }] },
    ])

    expect(migrateOldLitCategory(current)).toEqual(current)
  })
})
