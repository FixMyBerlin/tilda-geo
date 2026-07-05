import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, validationErrorState } from '@/server/utils/validation'
import { UpdateQaConfigFormSchema } from '../schemas'

export async function updateQaConfigWithData(
  data: z.infer<typeof UpdateQaConfigFormSchema>,
  headers: Headers,
) {
  try {
    await requireAdmin(headers)
    const { id, ...updateData } = data
    await db.qaConfig.update({ where: { id }, data: updateData })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Aktualisieren der QA-Konfiguration')
  }
}
