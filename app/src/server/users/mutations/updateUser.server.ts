import type { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { successState } from '@/server/utils/validation'
import { UpdateUserSchema } from '../schema'

const duplicateEmailMessage = 'Diese E-Mail-Adresse ist bereits vergeben.'
const updateUserErrorMessage = 'Fehler beim Aktualisieren des Accounts'

function isPrismaUniqueConstraintError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002'
  }
  if (typeof error === 'object' && error !== null && 'code' in error && 'name' in error) {
    const o = error as { code?: unknown; name?: unknown }
    return o.code === 'P2002' && o.name === 'PrismaClientKnownRequestError'
  }
  return false
}

function logUpdateUserError(context: 'duplicate-email' | 'unexpected', error: unknown) {
  if (isProd) return
  console.error(`[updateUserWithData] ${context}`, error)
}

export async function updateUserWithData(data: z.infer<typeof UpdateUserSchema>, headers: Headers) {
  try {
    const session = await requireAuth(headers)
    await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
      db.user.update({ where: { id: session.userId }, data }),
    )
    return successState({ message: 'Account erfolgreich aktualisiert' })
  } catch (error) {
    // P2002 `meta.target` is often the index name (`User_email_key`), not `email`; only `email` is unique here.
    if (isPrismaUniqueConstraintError(error)) {
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
