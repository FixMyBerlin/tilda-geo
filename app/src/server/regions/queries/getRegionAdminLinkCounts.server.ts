import db from '@/server/db.server'
import {
  noteFoldersInRegionWhere,
  qaConfigsInRegionWhere,
  regionAuditHistoryWhere,
  reviewListsInRegionWhere,
  usersInRegionWhere,
} from '@/server/regions/regionScopedWhere'
import { buildMapDatasetUploadsWhere } from '@/server/uploads/buildMapDatasetUploadsWhere.server'

/**
 * Row counts of the region-filtered admin lists the region edit page links to. Uses the lists' own
 * `?regionSlug=` where clauses (uploads: the default „Datensätze“ kind), so each count equals the
 * rows of the linked page. Callers must enforce admin auth.
 */
export async function getRegionAdminLinkCounts(region: { id: number; slug: string }) {
  const [memberships, uploads, qaConfigs, reviewLists, noteFolders, auditLog] = await Promise.all([
    db.user.count({ where: usersInRegionWhere(region.slug) }),
    db.mapDatasetUpload.count({ where: buildMapDatasetUploadsWhere({ regionSlug: region.slug }) }),
    db.qaConfig.count({ where: qaConfigsInRegionWhere(region.slug) }),
    db.reviewList.count({ where: reviewListsInRegionWhere(region.slug) }),
    db.noteFolder.count({ where: noteFoldersInRegionWhere(region.slug) }),
    db.auditLog.count({ where: regionAuditHistoryWhere(region.id) }),
  ])

  return { memberships, uploads, qaConfigs, reviewLists, noteFolders, auditLog }
}
