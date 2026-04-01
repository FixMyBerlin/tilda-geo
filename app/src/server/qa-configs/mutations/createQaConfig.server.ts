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

export async function createQaConfig(_prevState: FormState | null, formData: FormData) {
  try {
    const parsed = extractAndValidateFormData(formData, CreateQaConfigFormSchema)
    const result = await createQaConfigWithData(parsed, getRequestHeaders())
    if (result.success) throw redirect({ to: '/admin/qa-configs' })
    return result
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    if (isRedirect(error)) throw error
    return errorState(error, 'Fehler beim Anlegen der QA-Konfiguration')
  }
}
