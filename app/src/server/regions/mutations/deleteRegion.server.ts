import type { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import { deleteRegionConfig } from '@/server/regions/regionWriteService.server'
import { errorState, successState } from '@/server/utils/validation'
import { DeleteRegionSchema } from '../regionWriteSchema'

export async function deleteRegion(input: z.infer<typeof DeleteRegionSchema>, headers: Headers) {
  try {
    const admin = await requireAdmin(headers)
    const { slug } = DeleteRegionSchema.parse(input)
    await deleteRegionConfig(slug, adminFormAuditContext(headers, admin.userId))
    return successState()
  } catch (error) {
    return errorState(error, 'Fehler beim Löschen der Region')
  }
}
