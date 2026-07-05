import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, validationErrorState } from '@/server/utils/validation'
import { RegionFormSchema } from '../schemas'

export async function updateRegionWithData(
  data: z.infer<typeof RegionFormSchema>,
  headers: Headers,
) {
  try {
    await requireAdmin(headers)
    const { slug, ...updateData } = data
    await db.region.update({ where: { slug }, data: updateData })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Aktualisieren der Region')
  }
}
