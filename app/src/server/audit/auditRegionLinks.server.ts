import type { AUDITED_MODELS } from '@/server/audit/auditAuditedModels.const'
import { type AuditContext, getAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'

type AuditRegionLinksInput = {
  model: (typeof AUDITED_MODELS)[number]
  recordId: number | string
  oldRegionSlugs: string[]
  newRegionSlugs: string[]
}

const sortedUnique = (slugs: string[]) => [...new Set(slugs)].sort()

/**
 * Writes the AuditLog row for a change of the regions a record is linked to.
 *
 * The audit extension (prismaAuditExtensions.server) only diffs the scalar columns of the written
 * row, so `regions: { connect | disconnect | set }` leaves no trace: a relation-only update writes
 * no row at all, and an update that also changes columns writes a row without the regions. Call
 * this after such a write with the region slugs before and after.
 *
 * The row is separate from the automatic one (which the extension writes inside the Prisma call):
 * `UPDATE`, `changedFields: ['regions']`, `oldData` / `newData` `{ regionSlugs }` sorted. Nothing is
 * written when the list did not change. Actor and source come from `auditContext`, by default the
 * one of the surrounding `runWithAuditContextAsync`.
 *
 * Like the automatic rows this is best effort: not part of the write's transaction, and a failed
 * insert is logged instead of thrown, because the write itself already happened.
 */
export async function auditRegionLinksChange(
  { model, recordId, oldRegionSlugs, newRegionSlugs }: AuditRegionLinksInput,
  auditContext: AuditContext = getAuditContext(),
) {
  const oldSlugs = sortedUnique(oldRegionSlugs)
  const newSlugs = sortedUnique(newRegionSlugs)
  if (oldSlugs.length === newSlugs.length && oldSlugs.every((slug, i) => slug === newSlugs[i])) {
    return
  }

  try {
    await db.auditLog.create({
      data: {
        userId: auditContext.userId ?? undefined,
        ipAddress: auditContext.ipAddress ?? undefined,
        userAgent: auditContext.userAgent ?? undefined,
        metadata: auditContext.metadata ?? undefined,
        action: 'UPDATE',
        model,
        recordId: String(recordId),
        oldData: { regionSlugs: oldSlugs },
        newData: { regionSlugs: newSlugs },
        changedFields: ['regions'],
      },
    })
  } catch (error) {
    console.error('Failed to save region links audit log to database:', error)
  }
}
