import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import type { FormState } from '@/server/utils/validation'
import {
  errorState,
  extractAndValidateFormData,
  validationErrorState,
} from '@/server/utils/validation'
import { UpdateUserSchema } from '../schema'

export async function updateUserWithData(data: z.infer<typeof UpdateUserSchema>, headers: Headers) {
  try {
    const session = await requireAuth(headers)
    const parsed = UpdateUserSchema.parse(data)
    await db.user.update({ where: { id: session.userId }, data: parsed })
    return {
      success: true,
      message: 'Account erfolgreich aktualisiert',
      errors: {},
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorState(error)
    }
    return errorState(error, 'Fehler beim Aktualisieren des Accounts')
  }
}

export async function updateUser(_prevState: FormState | null, formData: FormData) {
  try {
    const parsed = extractAndValidateFormData(formData, UpdateUserSchema)
    return updateUserWithData(parsed, getRequestHeaders())
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Aktualisieren des Accounts')
  }
}
