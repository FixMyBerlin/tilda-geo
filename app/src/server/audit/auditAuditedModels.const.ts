/** Prisma models included in the audit-log extension (see prismaAuditExtensions.server).
 * Better Auth's `Verification` model is intentionally excluded: it only holds short-lived
 * OAuth/email tokens (create-then-delete noise, no actor). */
export const AUDITED_MODELS = [
  'User',
  'Session',
  'Account',
  'Region',
  'RegionCategoryAssignment',
  'RegionBackgroundAssignment',
  'RegionExportAssignment',
  'RegionNavigationLink',
  'RegionContract',
  'RegionUpload',
  'Membership',
  'MapDatasetUpload',
  'MapDatasetCategory',
  'Note',
  'NoteComment',
  'QaConfig',
  'QaEvaluation',
  'AdminApiToken',
] as const
