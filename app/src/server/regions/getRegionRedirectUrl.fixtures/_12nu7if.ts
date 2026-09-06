// Legacy RegionConfigTemplate fixture for getRegionRedirectUrl migration tests.
import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

// Old production lit category: roads `lit` subcategory + separate `lit-completeness` checkbox.
export const _12nu7if: MapDataCategoryParam[] = [
  {
    id: 'lit',
    active: false,
    subcategories: [
      {
        id: 'lit',
        styles: [
          { id: 'hidden', active: false },
          { id: 'default', active: true },
          { id: 'lit', active: false },
        ],
      },
      { id: 'lit-completeness', styles: [{ id: 'completeness', active: false }] },
    ],
  },
]
