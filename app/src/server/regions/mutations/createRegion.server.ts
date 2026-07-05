import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, validationErrorState } from '@/server/utils/validation'
import { RegionFormSchema } from '../schemas'

export async function createRegionWithData(
  data: z.infer<typeof RegionFormSchema>,
  headers: Headers,
) {
  try {
    await requireAdmin(headers)
    await db.region.create({ data })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Anlegen der Region')
  }
}
