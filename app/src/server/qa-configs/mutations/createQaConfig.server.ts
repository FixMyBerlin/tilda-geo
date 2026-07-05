import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, validationErrorState } from '@/server/utils/validation'
import { CreateQaConfigFormSchema } from '../schemas'

export async function createQaConfigWithData(
  data: z.infer<typeof CreateQaConfigFormSchema>,
  headers: Headers,
) {
  try {
    await requireAdmin(headers)
    await db.qaConfig.create({ data })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Anlegen der QA-Konfiguration')
  }
}
