import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { Prisma } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import type { FormState } from '@/server/utils/validation'
import { extractAndValidateFormData, validationErrorState } from '@/server/utils/validation'
import { UpdateUserSchema } from '../schema'

const duplicateEmailMessage = 'Diese E-Mail-Adresse ist bereits vergeben.'
const updateUserErrorMessage = 'Fehler beim Aktualisieren des Accounts'

function isEmailUniqueConstraintError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== 'P2002') return false

  const target = error.meta?.target
  const targetFields = Array.isArray(target)
    ? target.filter((value): value is string => typeof value === 'string')
    : typeof target === 'string'
      ? [target]
      : []

  return targetFields.includes('email')
}

function logUpdateUserError(context: 'duplicate-email' | 'unexpected', error: unknown) {
  if (isProd) return
  console.error(`[updateUserWithData] ${context}`, error)
}

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
    if (isEmailUniqueConstraintError(error)) {
      logUpdateUserError('duplicate-email', error)
      return {
        success: false,
        message: duplicateEmailMessage,
        errors: { email: [duplicateEmailMessage] },
      }
    }
    logUpdateUserError('unexpected', error)
    return { success: false, message: updateUserErrorMessage, errors: {} }
  }
}

export async function updateUser(_prevState: FormState | null, formData: FormData) {
  try {
    const parsed = extractAndValidateFormData(formData, UpdateUserSchema)
    return updateUserWithData(parsed, getRequestHeaders())
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    logUpdateUserError('unexpected', error)
    return { success: false, message: updateUserErrorMessage, errors: {} }
  }
}
