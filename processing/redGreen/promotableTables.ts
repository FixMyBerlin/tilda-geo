const PROMOTION_TABLE_DENYLIST = new Set([
  'User',
  'Session',
  'Account',
  'Verification',
  'RegionContract',
  'Region',
  'RegionUpload',
  'RegionCategoryAssignment',
  'RegionBackgroundAssignment',
  'RegionExportAssignment',
  'RegionNavigationLink',
  'RegionConfigTemplate',
  'AuditLog',
  'AdminApiToken',
  'Membership',
  'MapDatasetUpload',
  'MapDatasetLayerConfig',
  'MapDatasetCategory',
  'Note',
  'NoteComment',
  'QaConfig',
  'QaEvaluation',
  'DataSchemaImport',
])

// Never swapped: PostGIS catalog and per-run bookkeeping that primary must keep.
// Bookkeeping rows for a promoted run still need to reach primary — open follow-up,
// see docs/osm-red-green-status-2026-09.md.
export const PROMOTION_TABLE_SKIPLIST = new Set([
  'spatial_ref_sys',
  'meta',
  'todos_lines_campaign_stats',
])

export function isSkippedTable(table: string) {
  return PROMOTION_TABLE_SKIPLIST.has(table)
}

const PROMOTION_TABLE_DENY_PATTERNS = [/^prisma_/i]

export function assertPromotableTable(table: string) {
  if (PROMOTION_TABLE_DENYLIST.has(table)) {
    throw new Error(
      `Promotion blocked: public.${table} is on the denylist (app/user data must not be promoted).`,
    )
  }
  for (const pattern of PROMOTION_TABLE_DENY_PATTERNS) {
    if (pattern.test(table)) {
      throw new Error(`Promotion blocked: public.${table} matches denylist pattern ${pattern}.`)
    }
  }
}

export function assertPromotableTables(tables: string[]) {
  for (const table of tables) {
    assertPromotableTable(table)
  }
}

export function isIntermediateTable(table: string) {
  return table.startsWith('_')
}
