import { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { updateRegionConfig } from '@/server/regions/regionWriteService.server'
import { errorState, successState, validationErrorState } from '@/server/utils/validation'

export async function updateRegionWithData(
  routeSlug: string,
  data: RegionWriteInput,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    if (data.slug !== routeSlug) {
      throw new Error('Slug stimmt nicht mit der Bearbeitungs-URL überein')
    }
    await updateRegionConfig(routeSlug, data, adminFormAuditContext(headers, admin.userId))
    return successState()
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Aktualisieren der Region')
  }
}
