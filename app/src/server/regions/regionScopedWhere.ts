import type { Prisma } from '@/prisma/generated/client'

// `?regionSlug=` filters of the admin lists. The region edit page counts with the same clauses, so
// its link counts always match the rows of the filtered list. Callers trim the slug (see
// `optionalTrimmed`) so whitespace-only `?regionSlug=` is treated as no filter.

/** Users with a membership in the region (`/admin/memberships`). */
export const usersInRegionWhere = (regionSlug: string) =>
  ({ memberships: { some: { region: { slug: regionSlug } } } }) satisfies Prisma.UserWhereInput

/** QA configs of the region (`/admin/qa-configs`). */
export const qaConfigsInRegionWhere = (regionSlug: string) =>
  ({ region: { slug: regionSlug } }) satisfies Prisma.QaConfigWhereInput

/** Review lists linked to the region (`/admin/review-lists`). */
export const reviewListsInRegionWhere = (regionSlug: string) =>
  ({ regions: { some: { slug: regionSlug } } }) satisfies Prisma.ReviewListWhereInput

/** Note folders linked to the region (`/admin/note-folders`). */
export const noteFoldersInRegionWhere = (regionSlug: string) =>
  ({ regions: { some: { slug: regionSlug } } }) satisfies Prisma.NoteFolderWhereInput

/** Child rows of Region that MCP/admin region writes replace via deleteMany + createMany. */
const REGION_ASSIGNMENT_AUDIT_MODELS = [
  'RegionCategoryAssignment',
  'RegionBackgroundAssignment',
  'RegionExportAssignment',
  'RegionNavigationLink',
] as const

/** Region scalar row plus category/export/nav/background assignment changes for one region (`/admin/audit-log`). */
export const regionAuditHistoryWhere = (regionId: number): Prisma.AuditLogWhereInput => {
  const assignmentRegionFilter = REGION_ASSIGNMENT_AUDIT_MODELS.flatMap((model) => [
    {
      model,
      oldData: { path: ['regionId'], equals: regionId },
    },
    {
      model,
      newData: { path: ['regionId'], equals: regionId },
    },
  ]) satisfies Prisma.AuditLogWhereInput[]

  return {
    OR: [{ model: 'Region', recordId: String(regionId) }, ...assignmentRegionFilter],
  }
}
