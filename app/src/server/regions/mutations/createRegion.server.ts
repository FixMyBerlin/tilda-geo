import { z } from 'zod'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { createRegionConfig } from '@/server/regions/regionWriteService.server'
import { errorState, successState, validationErrorState } from '@/server/utils/validation'

export async function createRegionWithData(data: RegionWriteInput, headers: Headers) {
  try {
    const admin = await requireAdmin(headers)
    await createRegionConfig(data, adminFormAuditContext(headers, admin.userId))
    return successState()
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Anlegen der Region')
  }
}
