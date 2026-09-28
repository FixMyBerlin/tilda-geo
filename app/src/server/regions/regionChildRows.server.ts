import type db from '@/server/db.server'
import type { RegionChildRows } from '@/server/regions/regionConfigMapper.server'

type RegionChildRowsDb = Pick<
  typeof db,
  | 'regionCategoryAssignment'
  | 'regionBackgroundAssignment'
  | 'regionExportAssignment'
  | 'regionNavigationLink'
>

type StoredRegionChildren = {
  categoryAssignments: { categoryId: string; sortOrder: number }[]
  backgroundAssignments: { sourceId: string }[]
  exportAssignments: { exportId: string }[]
  navigationLinks: {
    name: string
    internalPath: string | null
    externalUrl: string | null
    sortOrder: number
  }[]
}

/** Include for `regionRowToChildRows` (same shape as the write input's child rows). */
export const regionChildRowsInclude = {
  categoryAssignments: true,
  backgroundAssignments: true,
  exportAssignments: true,
  navigationLinks: true,
} as const

/** Stored child rows → `RegionChildRows` (same keys and key order as the write input). */
export function regionRowToChildRows(region: StoredRegionChildren): RegionChildRows {
  return {
    categories: region.categoryAssignments.map(({ categoryId, sortOrder }) => ({
      categoryId,
      sortOrder,
    })),
    backgroundSources: region.backgroundAssignments.map(({ sourceId }) => ({ sourceId })),
    exports: region.exportAssignments.map(({ exportId }) => ({ exportId })),
    navigationLinks: region.navigationLinks.map(
      ({ name, internalPath, externalUrl, sortOrder }) => ({
        name,
        internalPath,
        externalUrl,
        sortOrder,
      }),
    ),
  }
}

/** Order-independent fingerprint; rows with `sortOrder` still differ when reordered. */
const rowsKey = (rows: object[]) =>
  rows
    .map((row) => JSON.stringify(row))
    .sort()
    .join('\n')

/**
 * Replaces the region's changed child tables with top-level `deleteMany` + `createManyAndReturn`,
 * so the audit extension writes one DELETE/CREATE row per child (it cannot see nested writes).
 * Unchanged tables are left alone to keep the region's audit history free of no-op churn.
 * `previous` is `null` for a new region.
 */
export async function writeRegionChildRows(
  client: RegionChildRowsDb,
  regionId: number,
  next: RegionChildRows,
  previous: RegionChildRows | null,
) {
  const where = { regionId }
  const withRegion = <T extends object>(rows: T[]) => rows.map((row) => ({ ...row, regionId }))
  const changed = (key: keyof RegionChildRows) =>
    !previous || rowsKey(previous[key]) !== rowsKey(next[key])

  if (changed('categories')) {
    if (previous) await client.regionCategoryAssignment.deleteMany({ where })
    if (next.categories.length) {
      await client.regionCategoryAssignment.createManyAndReturn({
        data: withRegion(next.categories),
      })
    }
  }

  if (changed('backgroundSources')) {
    if (previous) await client.regionBackgroundAssignment.deleteMany({ where })
    if (next.backgroundSources.length) {
      await client.regionBackgroundAssignment.createManyAndReturn({
        data: withRegion(next.backgroundSources),
      })
    }
  }

  if (changed('exports')) {
    if (previous) await client.regionExportAssignment.deleteMany({ where })
    if (next.exports.length) {
      await client.regionExportAssignment.createManyAndReturn({ data: withRegion(next.exports) })
    }
  }

  if (changed('navigationLinks')) {
    if (previous) await client.regionNavigationLink.deleteMany({ where })
    if (next.navigationLinks.length) {
      await client.regionNavigationLink.createManyAndReturn({
        data: withRegion(next.navigationLinks),
      })
    }
  }
}
