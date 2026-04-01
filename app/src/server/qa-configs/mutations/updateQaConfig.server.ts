import { isRedirect, redirect } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import type { FormState } from '@/server/utils/validation'
import {
  errorState,
  extractAndValidateFormData,
  validationErrorState,
} from '@/server/utils/validation'
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

export async function updateQaConfig(_prevState: FormState | null, formData: FormData) {
  try {
    const parsed = extractAndValidateFormData(formData, UpdateQaConfigFormSchema)
    const result = await updateQaConfigWithData(parsed, getRequestHeaders())
    if (result.success) throw redirect({ to: '/admin/qa-configs' })
    return result
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    if (isRedirect(error)) throw error
    return errorState(error, 'Fehler beim Aktualisieren der QA-Konfiguration')
  }
}
