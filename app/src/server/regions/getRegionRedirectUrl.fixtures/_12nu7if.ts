// Legacy RegionConfigTemplate fixture for getRegionRedirectUrl migration tests.
import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

// Test snapshot of the old production Beleuchtung config: roads `lit` plus a separate
// `lit-completeness` checkbox. Live URLs still go through getRegionRedirectUrl; this file
// only feeds the migration tests (checksum 12nu7if).
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
